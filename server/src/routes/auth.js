import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAuthUserByEmail, getAuthUserByUid, createAuthUser, setUser } from "../store.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function generateToken(uid, email, displayName) {
  return jwt.sign(
    { uid, email, displayName },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// GET /api/auth/me — return current user from Bearer token (for client session restore)
router.get("/me", (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getAuthUserByUid(payload.uid);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register — same shape as Firebase createUserWithEmailAndPassword + updateProfile
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (getAuthUserByEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const uid = `uid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const passwordHash = await bcrypt.hash(password, 10);
    createAuthUser({
      uid,
      email: normalizedEmail,
      displayName: fullName || null,
      passwordHash,
    });
    setUser(uid, {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      displayName: fullName || null,
    });
    const token = generateToken(uid, normalizedEmail, fullName || null);
    res.status(201).json({
      user: {
        uid,
        email: normalizedEmail,
        displayName: fullName || null,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = (email || "").trim().toLowerCase();
    const authUser = getAuthUserByEmail(normalizedEmail);
    if (!authUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, authUser.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = generateToken(authUser.uid, authUser.email, authUser.displayName);
    res.json({
      user: {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
