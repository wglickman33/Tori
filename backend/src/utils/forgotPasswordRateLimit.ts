import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

const EMAIL_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_MAX = 3;
const emailHits = new Map<string, number[]>();

function isTestEnv() {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

export const forgotPasswordIpLimiter = rateLimit({
  windowMs: EMAIL_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Try again later." },
  skip: () => isTestEnv(),
});

export function forgotPasswordEmailLimiter(req: Request, res: Response, next: NextFunction): void {
  if (isTestEnv()) {
    next();
    return;
  }

  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    next();
    return;
  }

  const now = Date.now();
  const prior = (emailHits.get(email) ?? []).filter((t) => now - t < EMAIL_WINDOW_MS);
  if (prior.length >= EMAIL_MAX) {
    res.status(429).json({ error: "Too many reset requests. Try again later." });
    return;
  }
  prior.push(now);
  emailHits.set(email, prior);
  next();
}
