import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import mongoose from "mongoose";
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
import apiKeysRoutes from "./infrastructure/apiKey/apiKey.route";
import dolynkRoutes from "./modules/dolynk-auth/dolynk-auth.routes";

import admin from "./core/config/firebase";


import { APP } from "./core/utils/messages.util";
import { errorMiddleware } from "./core/middleware/error.middleware";

// =============================
// ENV
// =============================
const {
  NODE_ENV = "development",
  MONGO_URI,
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

app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
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
app.use("/public", express.static(path.join(__dirname, "public")));
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
app.use("/api/api-keys", apiKeysRoutes);
app.use("/api/user-types", userTypeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/dolynk", dolynkRoutes);
app.use(errorMiddleware);

// =============================
// Healthcheck
// =============================
app.get("/healthz", (_: Request, res: Response) => {
  res.status(200).send(APP.HEALTH_OK);
});

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../public/.well-known/assetlinks.json')
  );
});

// =============================
// Deeplink (secure allowlist)
// =============================
const DEEPLINK_ALLOWED = new Set(["update-password"]);
const { APP_DOMAIN } = process.env;

app.get("/deeplink", (req: Request, res: Response) => {
  const { to, token } = req.query as { to?: string; token?: string };

  if (!to || !DEEPLINK_ALLOWED.has(to)) {
    return res.status(400).send('Paramètre "to" invalide.');
  }

  const deepLink = token
    ? `${APP_DOMAIN}/${to}?token=${encodeURIComponent(token)}`
    : `${APP_DOMAIN}/${to}`;

  console.log("Redirecting to:", deepLink);
  res.redirect(deepLink);
});

// =============================
// MongoDB connection
// =============================
if (!MONGO_URI) {
  console.error("[CONFIG] MONGO_URI manquant dans .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(APP.MONGO_CONNECTED))
  .catch(err => {
    console.error(APP.MONGO_CONNECTION_ERROR, err.message);
    process.exit(1);
  });

// =============================
// Export app (IMPORTANT)
// =============================
export default app;
