import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import userRoutes from "./modules/user/user.route";
import authRoutes from "./modules/auth/auth.route";
import userTypeRoutes from "./modules/user/userType.route";
import deviceRoutes from "./modules/device/device.route";
import notificationRoutes from "./modules/notification/notification.route";
import activityRoutes from "./modules/activity/activity.route";
import oauthRoutes from "./modules/integrations/apiClient.route";
import deepLinkRoutes from "./modules/deeplink/deeplink.route";

import { APP } from "./core/utils/messages.util";
import { errorMiddleware } from "./core/middleware/error.middleware";

// =============================
// ENV
// =============================
const {
  NODE_ENV = "development",
  CORS_ORIGINS,
} = process.env;

// =============================
// App
// =============================
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// =============================
// Security / CORS / Logs
// =============================
app.use(helmet());

const allowedOrigins = (CORS_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content",
    "Accept",
    "Content-Type",
    "Authorization",
  ],
  credentials: false,
};

app.use(cors(corsOptions));

// Access logs never contain token query parameters (password-reset links).
export const redactUrl = (url: string) =>
  url.replace(/([?&]token=)[^&#]*/gi, "$1[REDACTED]");
morgan.token("url", (req: Request) => redactUrl(req.originalUrl || req.url));

if (NODE_ENV !== "test") {
  app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}
app.use(compression());
app.use(
  express.json({
    limit: "10mb",
    // Keep the raw text of Dolynk webhook bodies: their numeric event ids exceed
    // Number.MAX_SAFE_INTEGER, so JSON.parse rounds them and the signature fails.
    verify: (req, _res, buf) => {
      const url = (req as Request).originalUrl ?? req.url ?? "";
      if (url.startsWith("/api/notifications")) (req as Request).rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// =============================
// Uploads directory (ensure exists)
// =============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =============================
// Static files
// =============================
// Repo-level public/ (one level above src/ and dist/). Images here are embedded
// in emails, so they must be loadable from other origins (webmail clients).
app.use(
  "/public",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "../public"), { maxAge: "7d", dotfiles: "ignore" })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =============================
// Rate limiting (auth)
// =============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// =============================
// API Routes
// =============================
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/user-types", userTypeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/packs", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use(errorMiddleware);

// =============================
// Healthcheck
// =============================
app.get("/healthz", (_: Request, res: Response) => {
  res.status(200).send(APP.HEALTH_OK);
});

// Universal Links / App Links files, reset-link fallback page, legacy /deeplink.
app.use(deepLinkRoutes);

// =============================
// Export app
// The app has no side effects on import (no DB connection, no env loading),
// so tests can import it directly. Startup lives in server.ts.
// =============================
export default app;
