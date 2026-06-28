// Gemini AI service. Implements the AI-driven features with graceful
// fallbacks so the API still works when GEMINI_API_KEY is not configured.
//
// Covers:
//   Feature 1  - Smart image understanding (analyzeIssueImage)
//   Feature 4  - AI summary (summarizeDescription)
//   Feature 5  - Department routing (suggestDepartment)
//   Feature 6  - Chat assistant (chatReply)
//   Feature 10 - Predictive insights (predictHotspot)
//   Feature 11 - Voice transcription (transcribeAudio)
//   Feature 12 - Emergency detection (folded into analyzeIssueImage)
import { getTextModel, getVisionModel, isGeminiConfigured } from "../config/gemini.js";

const CATEGORIES = [
  "POTHOLE",
  "WATER_LEAKAGE",
  "GARBAGE",
  "STREET_LIGHT",
  "ROAD_DAMAGE",
  "OPEN_MANHOLE",
  "ILLEGAL_DUMPING",
  "FALLEN_TREE",
  "DRAINAGE_BLOCKAGE",
  "OTHER",
];

const CATEGORY_TO_DEPARTMENT = {
  POTHOLE: "Road Maintenance",
  ROAD_DAMAGE: "Road Maintenance",
  OPEN_MANHOLE: "Road Maintenance",
  WATER_LEAKAGE: "Water Supply",
  GARBAGE: "Sanitation",
  ILLEGAL_DUMPING: "Sanitation",
  STREET_LIGHT: "Electricity",
  FALLEN_TREE: "Forest Department",
  DRAINAGE_BLOCKAGE: "Drainage",
  OTHER: "Road Maintenance",
};

// Extracts the first JSON object found in a model's text response.
function parseJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeCategory(value) {
  if (!value) return "OTHER";
  const upper = String(value).toUpperCase().replace(/\s+/g, "_");
  if (CATEGORIES.includes(upper)) return upper;
  // Fuzzy mapping for common AI outputs
  if (/BRIDGE|ROAD|CRACK|PAVEMENT|ASPHALT|COLLAPSE/.test(upper)) return "ROAD_DAMAGE";
  if (/POTHOLE|PIT/.test(upper)) return "POTHOLE";
  if (/WATER|LEAK|PIPE|FLOOD/.test(upper)) return "WATER_LEAKAGE";
  if (/GARBAGE|TRASH|WASTE|LITTER/.test(upper)) return "GARBAGE";
  if (/DUMP/.test(upper)) return "ILLEGAL_DUMPING";
  if (/LIGHT|LAMP|ELECTRIC/.test(upper)) return "STREET_LIGHT";
  if (/MANHOLE|SEWER/.test(upper)) return "OPEN_MANHOLE";
  if (/TREE|BRANCH/.test(upper)) return "FALLEN_TREE";
  if (/DRAIN|CLOG|BLOCK/.test(upper)) return "DRAINAGE_BLOCKAGE";
  return "OTHER";
}

/**
 * Feature 1 + 12: Analyze an issue image (and optional user text).
 * Returns category, severity, risk, emergency flag, estimated size, summary.
 *
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} [userText]
 */
export async function analyzeIssueImage(imageBuffer, mimeType, userText = "") {
  const model = getVisionModel();
  console.log("[gemini] analyzeIssueImage called:", { hasModel: !!model, bufferSize: imageBuffer?.length, mimeType });
  if (!model || !imageBuffer) {
    console.log("[gemini] Falling back — no model or no image buffer");
    return fallbackAnalysis(userText);
  }

  const prompt = `You are a civic issue analyst. Analyze the attached image of a community/civic problem${
    userText ? ` and the citizen's note: "${userText}"` : ""
  }.
Category guidance: Use ROAD_DAMAGE for bridges, roads, pavements, cracks, collapses, potholes in roads. Use POTHOLE only for round holes. Use WATER_LEAKAGE for pipes, taps, flooding. Use GARBAGE for litter/trash. Use ILLEGAL_DUMPING for large-scale dumping. Use STREET_LIGHT for lights/lamps. Use OPEN_MANHOLE for manholes/sewers. Use FALLEN_TREE for trees/branches. Use DRAINAGE_BLOCKAGE for drains. Only use OTHER if it truly fits none of these.
Respond ONLY with a JSON object using this exact shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "isEmergency": boolean,            // true for immediate dangers (live wires, gas, collapse)
  "estimatedDiameter": string,        // human-readable size estimate, or "unknown"
  "summary": string                   // MUST be between 30 and 35 words. Describe what the problem is, where it appears to be, and why it needs attention. Count your words carefully.
}`;

  try {
    let rawText = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent([
          { text: prompt },
          { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
        ]);
        rawText = result.response.text();
        break;
      } catch (retryErr) {
        console.log(`[gemini] Attempt ${attempt + 1} failed:`, retryErr.message);
        if (attempt < 2 && /503|overloaded|high demand|unavailable/i.test(retryErr.message)) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        } else {
          throw retryErr;
        }
      }
    }
    console.log("[gemini] Raw response:", rawText?.slice(0, 300));
    const parsed = parseJson(rawText);
    if (!parsed) {
      console.log("[gemini] Failed to parse JSON from response");
      return fallbackAnalysis(userText);
    }

    return {
      category: normalizeCategory(parsed.category),
      severity: parsed.severity || "MEDIUM",
      risk: parsed.risk || "MEDIUM",
      isEmergency: Boolean(parsed.isEmergency),
      estimatedDiameter: parsed.estimatedDiameter || "unknown",
      summary: parsed.summary || userText || "Community issue reported.",
    };
  } catch (err) {
    console.error("[gemini] analyzeIssueImage failed:", err.message);
    return fallbackAnalysis(userText);
  }
}

function fallbackAnalysis(userText) {
  return {
    category: "OTHER",
    severity: "MEDIUM",
    risk: "MEDIUM",
    isEmergency: false,
    estimatedDiameter: "unknown",
    summary: userText?.trim() || "Community issue reported (AI analysis unavailable).",
    fallback: true,
  };
}

/**
 * Feature 4: Convert rough citizen text into a clear, structured summary.
 */
export async function summarizeDescription(text) {
  const model = getTextModel();
  if (!model || !text?.trim()) return text?.trim() || "";

  try {
    const result = await model.generateContent(
      `Summarize the following civic complaint in EXACTLY 30 to 35 words. Not fewer, not more. ` +
        `Describe the problem, its location context, and its impact. Count your words carefully before responding. ` +
        `Return only the summary, nothing else.\n\n"${text}"`
    );
    return result.response.text().trim();
  } catch (err) {
    console.error("[gemini] summarizeDescription failed:", err.message);
    return text.trim();
  }
}

/**
 * Feature 5: Suggest a department name for a category.
 * Deterministic mapping (no API call needed) keeps routing fast & reliable.
 */
export function suggestDepartment(category) {
  return CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.OTHER;
}

/**
 * Admin helper: draft a polite, professional reason for rejecting a civic
 * report. Falls back to a sensible generic message when the model is offline.
 *
 * @param {{ title?: string, description?: string, category?: string, aiSummary?: string }} issue
 */
export async function generateRejectionReason(issue = {}) {
  const { title, description, category, aiSummary } = issue;
  const detail = aiSummary || description || title || "the reported issue";

  const fallback =
    "After review, this report could not be verified as an actionable civic " +
    "issue and has been rejected. If you believe this is a mistake, please file " +
    "a new report with clearer photos and additional details.";

  const model = getTextModel();
  if (!model) return fallback;

  try {
    const result = await model.generateContent(
      "You are a city civic-issues moderator. Write a polite, professional, and " +
        "constructive reason (2-3 sentences, max 60 words) explaining why the " +
        "following community report was rejected. Suggest what the citizen could " +
        "do next. Return only the reason text, with no preamble or quotes.\n\n" +
        `Title: ${title || "N/A"}\nCategory: ${category || "N/A"}\nDetails: ${detail}`
    );
    return result.response.text().trim() || fallback;
  } catch (err) {
    console.error("[gemini] generateRejectionReason failed:", err.message);
    return fallback;
  }
}

/**
 * Feature 6: AI chat assistant reply.
 * @param {string} message
 * @param {Array<{role: string, content: string}>} [history]
 * @param {object} [context]  optional issue context to ground the answer
 */
export async function chatReply(message, history = [], context = null) {
  const model = getTextModel();
  if (!model) {
    return "The AI assistant is currently unavailable. Please try again later.";
  }

  const systemPreamble =
    "You are Community Hero's helpful civic assistant. Answer concisely about " +
    "issue status, processes, and expected timelines. If asked about a specific " +
    "complaint, use the provided context.";

  const contextText = context
    ? `\nIssue context: ${JSON.stringify(context)}`
    : "";

  const historyText = history
    .map((m) => `${m.role === "ASSISTANT" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  try {
    let response = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(
          `${systemPreamble}${contextText}\n\n${historyText}\nUser: ${message}\nAssistant:`
        );
        response = result.response.text().trim();
        break;
      } catch (retryErr) {
        if (attempt < 2 && /503|429|overloaded|high demand|unavailable|quota/i.test(retryErr.message)) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        } else {
          throw retryErr;
        }
      }
    }
    return response || "The AI is temporarily unavailable due to high demand. Please try again in a few minutes.";
  } catch (err) {
    console.error("[gemini] chatReply failed:", err.message);
    if (/429|quota/i.test(err.message)) {
      return "Daily AI quota exceeded. The quota resets tomorrow. Please try again later.";
    }
    return "The AI is temporarily unavailable due to high demand. Please try again in a few minutes.";
  }
}

/**
 * Feature 10: Predictive insight from a cluster of past issues.
 * @param {Array<object>} issues
 */
export async function predictHotspot(issues = []) {
  const model = getTextModel();
  if (!model || issues.length === 0) {
    return { prediction: "Not enough data for a prediction.", fallback: true };
  }

  const summary = issues
    .map((i) => `${i.category} (severity ${i.severity}) at ${i.address || "unknown"}`)
    .join("; ");

  try {
    const result = await model.generateContent(
      `Given these recent civic issues in one area: ${summary}. ` +
        `In one sentence, predict the likely near-future risk and a recommended preventive action.`
    );
    return { prediction: result.response.text().trim() };
  } catch (err) {
    console.error("[gemini] predictHotspot failed:", err.message);
    return { prediction: "Prediction unavailable.", fallback: true };
  }
}

/**
 * Feature 11: Transcribe an audio note and extract structured fields.
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 */
export async function transcribeAudio(audioBuffer, mimeType) {
  const model = getTextModel();
  if (!model || !audioBuffer) {
    return { transcript: "", category: "OTHER", summary: "", fallback: true };
  }

  try {
    const result = await model.generateContent([
      {
        text:
          "Transcribe this civic complaint audio, then respond ONLY with JSON: " +
          `{ "transcript": string, "category": one of ${JSON.stringify(CATEGORIES)}, "summary": string }`,
      },
      { inlineData: { data: audioBuffer.toString("base64"), mimeType } },
    ]);
    const parsed = parseJson(result.response.text());
    if (!parsed) return { transcript: "", category: "OTHER", summary: "", fallback: true };
    return {
      transcript: parsed.transcript || "",
      category: normalizeCategory(parsed.category),
      summary: parsed.summary || "",
    };
  } catch (err) {
    console.error("[gemini] transcribeAudio failed:", err.message);
    return { transcript: "", category: "OTHER", summary: "", fallback: true };
  }
}

export { isGeminiConfigured, CATEGORY_TO_DEPARTMENT };
