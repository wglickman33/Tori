import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { householdsRouter } from "./routes/households.js";
import { foldersRouter } from "./routes/folders.js";
import { itemsRouter } from "./routes/items.js";
import { eventsRouter } from "./routes/events.js";
import { exportRouter } from "./routes/export.js";
import { itemImagesRouter } from "./routes/itemImages.js";
import { UPLOADS_DIR } from "./utils/imageStorage.js";
import "./models/index.js";

const PRODUCTION_FRONTEND = "https://torihome.netlify.app";

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  PRODUCTION_FRONTEND,
];

function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    return true;
  }
  // Netlify production + deploy previews
  if (/^https:\/\/[\w-]+(--[\w-]+)?\.netlify\.app$/.test(origin)) return true;
  return false;
}

export function createApp() {
  const app = express();

  const fromEnv = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((u) => u.trim()).filter(Boolean)
    : [];
  const allowedOrigins = [...new Set([...defaultOrigins, ...fromEnv])];

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        cb(null, isAllowedOrigin(origin, allowedOrigins));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts. Try again later." },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Try again later." },
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

  app.use("/api/auth", ...(isTest ? [authRouter] : [authLimiter, authRouter]));
  // SSE must be mounted before /api/households (which applies Bearer auth to all subpaths).
  app.use("/api/households/:householdId/events", eventsRouter);
  app.use("/api/households", ...(isTest ? [householdsRouter] : [apiLimiter, householdsRouter]));
  app.use(
    "/api/households/:householdId/folders",
    ...(isTest ? [foldersRouter] : [apiLimiter, foldersRouter])
  );
  app.use(
    "/api/households/:householdId/items/:itemId/image",
    ...(isTest ? [itemImagesRouter] : [apiLimiter, itemImagesRouter])
  );
  app.use(
    "/api/households/:householdId/items",
    ...(isTest ? [itemsRouter] : [apiLimiter, itemsRouter])
  );
  app.use(
    "/api/households/:householdId/export",
    ...(isTest ? [exportRouter] : [apiLimiter, exportRouter])
  );
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  return app;
}
