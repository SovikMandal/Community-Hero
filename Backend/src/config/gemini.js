// Google Gemini client configuration.
// Exposes text + vision model instances used by the AI services.
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

export const isGeminiConfigured = Boolean(env.gemini.apiKey);

let genAI = null;
if (isGeminiConfigured) {
  genAI = new GoogleGenerativeAI(env.gemini.apiKey);
}

/** Returns a text-generation model, or null if Gemini is not configured. */
export function getTextModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: env.gemini.model });
}

/** Returns a vision-capable model, or null if Gemini is not configured. */
export function getVisionModel() {
  if (!genAI) return null;
  return genAI.getGenerativeModel({ model: env.gemini.visionModel });
}

export default genAI;
