import jwt from "jsonwebtoken";
import { getAuthUserByUid } from "../store.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/**
 * Require valid Bearer token; sets req.authUser = { uid, email, displayName }.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getAuthUserByUid(payload.uid);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.authUser = { uid: user.uid, email: user.email, displayName: user.displayName };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Optional auth: if valid token present, sets req.authUser; otherwise continues without it.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getAuthUserByUid(payload.uid);
    if (user) req.authUser = { uid: user.uid, email: user.email, displayName: user.displayName };
  } catch (_) {}
  next();
}
