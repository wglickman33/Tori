import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens.js";

export type AuthedRequest = Request & { userId?: string; userEmail?: string; userDisplayName?: string };

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userDisplayName = payload.displayName;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
