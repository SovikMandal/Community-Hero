// Unified AI service — single entry point for all AI features.
// Delegates to either Gemini or Cloudflare Workers AI based on the
// AI_PROVIDER environment variable ("gemini" | "cloudflare").
//
// All controllers import from this file instead of a specific provider.
// To switch providers, change one env var — zero code changes needed.
import { env } from "../config/env.js";

import * as gemini from "./gemini.service.js";
import * as cloudflare from "./cloudflare.service.js";

const provider = (env.aiProvider || "gemini").toLowerCase();
const ai = provider === "cloudflare" ? cloudflare : gemini;

console.log(`[ai] Using AI provider: ${provider}`);

// Re-export every function through the active provider.
export const analyzeIssueImage = ai.analyzeIssueImage;
export const summarizeDescription = ai.summarizeDescription;
export const suggestDepartment = ai.suggestDepartment;
export const chatReply = ai.chatReply;
export const predictHotspot = ai.predictHotspot;
export const transcribeAudio = ai.transcribeAudio;

// Admin rejection-reason drafting. Gemini-specific; fall back to the Gemini
// implementation when the active provider doesn't implement it.
export const generateRejectionReason =
  ai.generateRejectionReason ?? gemini.generateRejectionReason;

export const isAiConfigured =
  provider === "cloudflare" ? ai.isCloudflareConfigured : ai.isGeminiConfigured;

export const CATEGORY_TO_DEPARTMENT = ai.CATEGORY_TO_DEPARTMENT;
