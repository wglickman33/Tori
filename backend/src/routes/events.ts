import { Router } from "express";
import { verifyAccessToken } from "../utils/tokens.js";
import { getMembership } from "../utils/householdAccess.js";
import { subscribeHouseholdEvents } from "../utils/householdEvents.js";

export const eventsRouter = Router({ mergeParams: true });

function readQueryToken(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

eventsRouter.get("/", async (req, res) => {
  const householdId = String((req.params as { householdId?: string }).householdId ?? "");
  if (!householdId) {
    res.status(400).json({ error: "householdId is required" });
    return;
  }
  const token = readQueryToken(req.query.token);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const membership = await getMembership(householdId, userId);
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(": connected\n\n");

  const unsubscribe = subscribeHouseholdEvents(householdId, userId, res);
  const ping = setInterval(() => {
    res.write(": ping\n\n");
  }, 25000);

  const membershipCheck = setInterval(async () => {
    const stillMember = await getMembership(householdId, userId);
    if (!stillMember) {
      res.write(`event: membership.revoked\n`);
      res.write(`data: ${JSON.stringify({ type: "membership.revoked", householdId, actorUserId: userId })}\n\n`);
      clearInterval(ping);
      clearInterval(membershipCheck);
      unsubscribe();
      res.end();
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(ping);
    clearInterval(membershipCheck);
    unsubscribe();
  });
});
