// Centralized, validated environment configuration.
import dotenv from "dotenv";

dotenv.config();

function required(key, fallback = undefined) {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    // Don't crash at import time in dev for optional integrations; warn instead.
    console.warn(`[config] Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: process.env.JWT_ACCESS_SECRET || "dev_insecure_secret_change_me",
  jwtExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret_change_me",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    visionModel: process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash",
  },

  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },

  // "gemini" or "cloudflare" — controls which AI provider is used
  aiProvider: process.env.AI_PROVIDER || "gemini",
};

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
