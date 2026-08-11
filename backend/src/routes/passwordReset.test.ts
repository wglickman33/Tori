import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import { PasswordResetToken, RefreshToken, User } from "../models/index.js";
import { hashToken, issueRefreshToken } from "../utils/tokens.js";
import {
  lastPasswordResetEmail,
  type PasswordResetEmailParams,
} from "../utils/email.js";

const app = createApp();
const suffix = Date.now();

/** Read via a function so TS does not treat the mutable module field as permanently null. */
function currentResetEmail(): PasswordResetEmailParams | null {
  return lastPasswordResetEmail.params;
}

describe("password reset", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("forgot-password always returns generic 200 and emails known users", async () => {
    lastPasswordResetEmail.params = null;
    const email = `reset-${suffix}@example.com`;
    await request(app).post("/api/auth/register").send({
      displayName: "Reset User",
      email,
      password: "password123",
    });

    const unknown = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `missing-${suffix}@example.com` });
    expect(unknown.status).toBe(200);
    expect(unknown.body.message).toMatch(/if an account exists/i);
    expect(currentResetEmail()).toBeNull();

    const known = await request(app).post("/api/auth/forgot-password").send({ email });
    expect(known.status).toBe(200);
    expect(known.body.message).toMatch(/if an account exists/i);

    const sent = currentResetEmail();
    if (!sent) {
      throw new Error("expected password reset email for known user");
    }
    expect(sent.toEmail).toBe(email);
    expect(sent.resetLink).toContain("/reset-password?token=");

    const user = await User.findOne({ where: { email } });
    const tokens = await PasswordResetToken.findAll({ where: { userId: user!.id, used: false } });
    expect(tokens).toHaveLength(1);
  });

  it("reset-password happy path, rejects invalid/expired/reused tokens", async () => {
    const email = `reset2-${suffix}@example.com`;
    const reg = await request(app).post("/api/auth/register").send({
      displayName: "Reset Two",
      email,
      password: "password123",
    });
    const userId = reg.body.user.id as string;
    await issueRefreshToken(userId);

    const raw = crypto.randomBytes(32).toString("hex");
    await PasswordResetToken.create({
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
    });

    const bad = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token", newPassword: "newpassword1" });
    expect(bad.status).toBe(400);

    const expiredRaw = crypto.randomBytes(32).toString("hex");
    await PasswordResetToken.create({
      userId,
      tokenHash: hashToken(expiredRaw),
      expiresAt: new Date(Date.now() - 1000),
      used: false,
    });
    const expired = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: expiredRaw, newPassword: "newpassword1" });
    expect(expired.status).toBe(400);

    const ok = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: raw, newPassword: "newpassword1" });
    expect(ok.status).toBe(200);

    const refreshLeft = await RefreshToken.count({ where: { userId } });
    expect(refreshLeft).toBe(0);

    const loginOld = await request(app).post("/api/auth/login").send({
      email,
      password: "password123",
    });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post("/api/auth/login").send({
      email,
      password: "newpassword1",
    });
    expect(loginNew.status).toBe(200);

    const reused = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: raw, newPassword: "anotherpass1" });
    expect(reused.status).toBe(400);
  });
});
