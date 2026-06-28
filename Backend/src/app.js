// Express application setup: security, parsing, logging, routes, errors.
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env, isDev } from "./config/env.js";
import { isGeminiConfigured } from "./config/gemini.js";
import { isCloudinaryConfigured } from "./config/cloudinary.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl === "*" ? true : env.clientUrl.split(","),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
if (isDev) app.use(morgan("dev"));

// Basic rate limiting to protect the API.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Health check ---
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    integrations: {
      gemini: isGeminiConfigured,
      cloudinary: isCloudinaryConfigured,
    },
  });
});

// --- API routes ---
app.use("/api", apiRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
