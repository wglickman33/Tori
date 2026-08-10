import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { HouseholdMember, PasswordResetToken, RefreshToken, User } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import {
  forgotPasswordSchema,
  formatZodError,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../utils/validation.js";
import {
  hashToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  signAccessToken,
} from "../utils/tokens.js";
import { destroyHouseholdData } from "../utils/householdCleanup.js";
import { closeUserHouseholdStreams } from "../utils/householdEvents.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import {
  forgotPasswordEmailLimiter,
  forgotPasswordIpLimiter,
} from "../utils/forgotPasswordRateLimit.js";

export const authRouter = Router();

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

async function issueSession(user: User) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  const refreshToken = await issueRefreshToken(user.id);
  return { user: publicUser(user), accessToken, refreshToken };
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    email,
    passwordHash,
    displayName: parsed.data.displayName,
  });

  res.status(201).json(await issueSession(user));
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json(await issueSession(user));
});

authRouter.get("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(publicUser(user));
});

authRouter.patch("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const user = await User.findByPk(req.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const { displayName, email, currentPassword, newPassword } = parsed.data;

  if (newPassword) {
    const ok = await bcrypt.compare(currentPassword!, user.passwordHash);
    if (!ok) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ where: { email: email.toLowerCase() } });
    if (taken) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    user.email = email.toLowerCase();
  }

  if (displayName) user.displayName = displayName;
  await user.save();
  res.json(publicUser(user));
});

authRouter.delete("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const membership = await HouseholdMember.findOne({ where: { userId } });

  if (membership) {
    if (membership.role === "owner") {
      const others = await HouseholdMember.count({
        where: { householdId: membership.householdId },
      });
      if (others > 1) {
        res.status(400).json({
          error: "Remove other household members before deleting your account, or transfer ownership first",
        });
        return;
      }
      await destroyHouseholdData(membership.householdId);
    } else {
      await membership.destroy();
      closeUserHouseholdStreams(membership.householdId, userId);
    }
  }

  await RefreshToken.destroy({ where: { userId } });
  await User.destroy({ where: { id: userId } });
  res.status(204).send();
});

authRouter.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const rotated = await rotateRefreshToken(parsed.data.refreshToken);
  if (!rotated) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const user = await User.findByPk(rotated.userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  res.json({
    user: publicUser(user),
    accessToken,
    refreshToken: rotated.refreshToken,
  });
});

authRouter.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (parsed.success) {
    await revokeRefreshToken(parsed.data.refreshToken);
  }
  res.status(204).send();
});

const FORGOT_OK = {
  message: "If an account exists for that email, we sent a reset link.",
};

authRouter.post(
  "/forgot-password",
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ where: { email } });

    if (user) {
      await PasswordResetToken.update(
        { used: true },
        { where: { userId: user.id, used: false } }
      );

      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await PasswordResetToken.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
        used: false,
      });

      const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(
        /\/$/,
        ""
      );
      const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendPasswordResetEmail({
          toName: user.displayName,
          toEmail: user.email,
          resetLink,
        });
      } catch (err) {
        console.error("Password reset email failed", err);
      }
    }

    res.status(200).json(FORGOT_OK);
  }
);

authRouter.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const tokenHash = hashToken(parsed.data.token);
  const row = await PasswordResetToken.findOne({
    where: { tokenHash, used: false },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  const user = await User.findByPk(row.userId);
  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset link" });
    return;
  }

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await user.save();
  row.used = true;
  await row.save();
  await RefreshToken.destroy({ where: { userId: user.id } });

  res.status(200).json({ message: "Password updated. You can log in with your new password." });
});
