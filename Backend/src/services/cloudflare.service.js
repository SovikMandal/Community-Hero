// Cloudflare Workers AI service.
// Drop-in replacement for gemini.service.js — exports the same function
// signatures so the unified ai.service.js can swap between providers.
//
// Models used (all free tier):
//   Text  : @cf/meta/llama-3.3-70b-instruct-fp8-fast
//   Vision: @cf/llava-hf/llava-1.5-7b-hf  (image understanding)
//   Audio : @cf/openai/whisper  (speech-to-text)
import { cfRun, cfRunBinary, isCloudflareConfigured } from "../config/cloudflare.js";

// ── Constants (shared with gemini.service.js) ────────────────────────────────
const CATEGORIES = [
  "POTHOLE", "WATER_LEAKAGE", "GARBAGE", "STREET_LIGHT", "ROAD_DAMAGE",
  "OPEN_MANHOLE", "ILLEGAL_DUMPING", "FALLEN_TREE", "DRAINAGE_BLOCKAGE", "OTHER",
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

const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const WHISPER_MODEL = "@cf/openai/whisper";

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseJson(text) {
  if (!text) return null;
  // LLaVA often escapes underscores (markdown-style) — clean before parsing
  const cleaned = text.replace(/\\_/g, "_");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function normalizeCategory(value) {
  if (!value) return "OTHER";
  const upper = String(value).toUpperCase().replace(/\s+/g, "_");
  if (CATEGORIES.includes(upper)) return upper;
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

// ── Feature 1 + 12: Image analysis (two-step) ──────────────────────────────
// Step 1: LLaVA describes the image (it's good at seeing, bad at structured output)
// Step 2: Llama 3.3 70B analyzes the description (great at structured reasoning)
export async function analyzeIssueImage(imageBuffer, mimeType, userText = "") {
  if (!isCloudflareConfigured || !imageBuffer) {
    console.log("[cloudflare] Falling back — not configured or no image");
    return fallbackAnalysis(userText);
  }

  try {
    // Step 1: Get a detailed description from LLaVA
    const visionResult = await cfRun(VISION_MODEL, {
      prompt: "Describe this image in detail. Focus on: what civic/infrastructure problem is visible, how severe does it look, what is the approximate size, and is there any immediate danger to people. Be specific and detailed.",
      image: [...imageBuffer],
    });

    const imageDescription = visionResult?.description || visionResult?.response || "";
    console.log("[cloudflare] Vision description:", imageDescription?.slice(0, 300));

    if (!imageDescription) {
      return fallbackAnalysis(userText);
    }

    // Step 2: Use Llama 3.3 70B to analyze the description into structured data
    const analysisResult = await cfRun(TEXT_MODEL, {
      messages: [
        {
          role: "system",
          content: `You are an expert civic issue analyst. Based on an image description and optional citizen notes, classify the issue accurately.

CATEGORY GUIDE:
- ROAD_DAMAGE: bridges, roads, pavements, cracks, collapses, structural road damage
- POTHOLE: round holes specifically in road surface
- WATER_LEAKAGE: pipes, taps, flooding, water supply issues
- GARBAGE: litter, trash, waste accumulation
- ILLEGAL_DUMPING: large-scale illegal waste dumping
- STREET_LIGHT: broken/non-working lights or lamps
- OPEN_MANHOLE: open manholes, sewers
- FALLEN_TREE: fallen trees or branches
- DRAINAGE_BLOCKAGE: blocked drains, clogged drainage
- OTHER: only if it truly fits none of the above

SEVERITY GUIDE:
- CRITICAL: Immediate danger to life (exposed wires, gas leak, structural collapse, deep open manhole)
- HIGH: Significant hazard or large-scale damage (large potholes >30cm, major water leakage flooding road, fallen tree blocking road)
- MEDIUM: Moderate issue affecting daily life (medium potholes, garbage accumulation, broken street light)
- LOW: Minor cosmetic or non-urgent issue (small cracks, minor litter, faded road markings)

RISK GUIDE:
- VERY_HIGH: Could cause death or serious injury imminently
- HIGH: Could cause injury or major property damage if not addressed soon
- MEDIUM: Causes inconvenience, may worsen over time
- LOW: Minimal risk, cosmetic issue

Be accurate and realistic with severity. Do NOT default to MEDIUM — actually assess the image description.
Respond ONLY with a JSON object, no other text.`,
        },
        {
          role: "user",
          content: `Image description: "${imageDescription}"${userText ? `\nCitizen's note: "${userText}"` : ""}

Respond with this JSON:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
  "isEmergency": true or false,
  "estimatedDiameter": "size estimate or unknown",
  "summary": "MUST be between 30 and 35 words. Describe what the problem is, where it appears to be, and why it needs attention. Count your words carefully."
}`,
        },
      ],
    });

    const rawResponse = analysisResult?.response;
    const rawText = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse) || "";
    console.log("[cloudflare] Analysis response:", rawText.slice(0, 400));
    const parsed = parseJson(rawText);

    if (!parsed) {
      return {
        ...fallbackAnalysis(userText || imageDescription?.slice(0, 200)),
        summary: imageDescription?.slice(0, 300) || userText || "Community issue reported.",
      };
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
    console.error("[cloudflare] analyzeIssueImage failed:", err.message);
    return fallbackAnalysis(userText);
  }
}

// ── Feature 4: AI text summary ──────────────────────────────────────────────
export async function summarizeDescription(text) {
  if (!isCloudflareConfigured || !text?.trim()) return text?.trim() || "";

  try {
    const result = await cfRun(TEXT_MODEL, {
      messages: [
        {
          role: "system",
          content: "Summarize civic complaints in EXACTLY 30 to 35 words. Not fewer, not more. Describe the problem, its location context, and its impact. Count your words carefully. Return only the summary.",
        },
        { role: "user", content: text },
      ],
    });
    return (result?.response || text).trim();
  } catch (err) {
    console.error("[cloudflare] summarizeDescription failed:", err.message);
    return text.trim();
  }
}

// ── Feature 5: Department routing (deterministic, same as Gemini) ────────────
export function suggestDepartment(category) {
  return CATEGORY_TO_DEPARTMENT[category] || CATEGORY_TO_DEPARTMENT.OTHER;
}

// ── Feature 6: Chat assistant ───────────────────────────────────────────────
export async function chatReply(message, history = [], context = null) {
  if (!isCloudflareConfigured) {
    return "The AI assistant is currently unavailable. Please try again later.";
  }

  const systemMsg =
    "You are Community Hero's helpful civic assistant. Answer concisely about " +
    "issue status, processes, and expected timelines. If asked about a specific " +
    "complaint, use the provided context.";

  const contextText = context ? `\nIssue context: ${JSON.stringify(context)}` : "";

  const messages = [
    { role: "system", content: `${systemMsg}${contextText}` },
    ...history.map((m) => ({
      role: m.role === "ASSISTANT" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const result = await cfRun(TEXT_MODEL, { messages });
    return (result?.response || "").trim() ||
      "The AI is temporarily unavailable. Please try again in a few minutes.";
  } catch (err) {
    console.error("[cloudflare] chatReply failed:", err.message);
    return "The AI is temporarily unavailable. Please try again in a few minutes.";
  }
}

// ── Feature 10: Predictive insight ──────────────────────────────────────────
export async function predictHotspot(issues = []) {
  if (!isCloudflareConfigured || issues.length === 0) {
    return { prediction: "Not enough data for a prediction.", fallback: true };
  }

  const summary = issues
    .map((i) => `${i.category} (severity ${i.severity}) at ${i.address || "unknown"}`)
    .join("; ");

  try {
    const result = await cfRun(TEXT_MODEL, {
      messages: [
        { role: "system", content: "You are a civic infrastructure analyst." },
        {
          role: "user",
          content: `Given these recent civic issues in one area: ${summary}. In one sentence, predict the likely near-future risk and a recommended preventive action.`,
        },
      ],
    });
    return { prediction: (result?.response || "Prediction unavailable.").trim() };
  } catch (err) {
    console.error("[cloudflare] predictHotspot failed:", err.message);
    return { prediction: "Prediction unavailable.", fallback: true };
  }
}

// ── Feature 11: Voice transcription ─────────────────────────────────────────
export async function transcribeAudio(audioBuffer, mimeType) {
  if (!isCloudflareConfigured || !audioBuffer) {
    return { transcript: "", category: "OTHER", summary: "", fallback: true };
  }

  try {
    // Whisper accepts raw audio bytes
    const result = await cfRunBinary(WHISPER_MODEL, audioBuffer);
    const transcript = result?.text || "";

    if (!transcript) {
      return { transcript: "", category: "OTHER", summary: "", fallback: true };
    }

    // Use the text model to extract structured fields from the transcript
    const extraction = await cfRun(TEXT_MODEL, {
      messages: [
        {
          role: "system",
          content: `Extract category and summary from a civic complaint transcript. Respond ONLY with JSON: { "category": one of ${JSON.stringify(CATEGORIES)}, "summary": string }`,
        },
        { role: "user", content: transcript },
      ],
    });

    const parsed = parseJson(extraction?.response);
    return {
      transcript,
      category: normalizeCategory(parsed?.category),
      summary: parsed?.summary || transcript,
    };
  } catch (err) {
    console.error("[cloudflare] transcribeAudio failed:", err.message);
    return { transcript: "", category: "OTHER", summary: "", fallback: true };
  }
}

export { isCloudflareConfigured, CATEGORY_TO_DEPARTMENT };
