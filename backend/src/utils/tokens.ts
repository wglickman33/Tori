import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { RefreshToken } from "../models/RefreshToken.js";

export type AccessPayload = { sub: string; email: string; displayName: string };

function requireSecret(name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${name} must be set in production`);
    }
    return name === "JWT_SECRET" ? "dev-access-secret" : "dev-refresh-secret";
  }
  return value;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, requireSecret("JWT_SECRET"), { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, requireSecret("JWT_SECRET")) as AccessPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(raw),
    expiresAt,
  });
  return raw;
}

export async function rotateRefreshToken(rawToken: string): Promise<{ userId: string; refreshToken: string } | null> {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ where: { tokenHash } });
  if (!existing) return null;
  if (existing.expiresAt.getTime() < Date.now()) {
    await existing.destroy();
    return null;
  }
  const userId = existing.userId;
  await existing.destroy();
  const refreshToken = await issueRefreshToken(userId);
  return { userId, refreshToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await RefreshToken.destroy({ where: { tokenHash: hashToken(rawToken) } });
}
