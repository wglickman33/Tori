import { Router, type Request } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { requireMembership } from "../utils/householdAccess.js";
import { validateToriChatBody } from "../utils/validation.js";
import { isToriOffTopic, TORI_OFF_TOPIC_REPLY } from "../utils/toriGuardrails.js";
import { runToriAgent } from "../utils/toriAgent.js";
import { openToriEventStream, wantsEventStream, writeSse } from "../utils/sse.js";

const router = Router();
type AuthRequest = Request & { userId?: string };

router.use(authMiddleware);

router.post("/chat", async (req: AuthRequest, res) => {
  const parsed = validateToriChatBody((req.body ?? {}) as Record<string, unknown>);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    await requireMembership(parsed.householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const lastUser = [...parsed.messages].reverse().find((message) => message.role === "user");
  if (lastUser && isToriOffTopic(lastUser.content)) {
    if (wantsEventStream(req)) {
      openToriEventStream(res);
      writeSse(res, "started", { ok: true });
      writeSse(res, "reply", { reply: TORI_OFF_TOPIC_REPLY });
      res.end();
      return;
    }
    res.json({ reply: TORI_OFF_TOPIC_REPLY });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    res.status(503).json({ error: "Tori AI is not configured yet." });
    return;
  }

  const stream = wantsEventStream(req);
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  if (stream) {
    openToriEventStream(res);
    writeSse(res, "started", { ok: true });
    keepAlive = setInterval(() => {
      if (!res.writableEnded) res.write(": ping\n\n");
    }, 15_000);
    req.on("close", () => {
      if (keepAlive) clearInterval(keepAlive);
    });
  }

  try {
    const result = await runToriAgent(req.userId!, parsed.householdId, parsed.messages, {
      apiKey,
      onEvent: stream
        ? (event) => {
            if (!res.writableEnded) writeSse(res, event.type, event);
          }
        : undefined,
    });

    if (stream) {
      if (keepAlive) clearInterval(keepAlive);
      if (res.writableEnded) return;
      if (!result.ok) {
        writeSse(res, "error", { error: result.error, status: result.status });
        res.end();
        return;
      }
      writeSse(res, "reply", {
        reply: result.reply,
        ...(result.pendingAction ? { pendingAction: result.pendingAction } : {}),
      });
      res.end();
      return;
    }

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    if (result.pendingAction) {
      res.json({ reply: result.reply, pendingAction: result.pendingAction });
      return;
    }

    res.json({ reply: result.reply });
  } catch (err) {
    console.error(err);
    if (stream) {
      if (keepAlive) clearInterval(keepAlive);
      if (!res.writableEnded) {
        writeSse(res, "error", {
          error: "Tori AI could not reply right now. Try again.",
          status: 502,
        });
        res.end();
      }
      return;
    }
    if (!res.headersSent) {
      res.status(502).json({ error: "Tori AI could not reply right now. Try again." });
    }
  }
});

export { router as toriRouter };
