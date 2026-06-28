// Voice controller (Feature 11): transcribe an audio note and extract fields
// the client can prefill into the issue report form.
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { transcribeAudio } from "../services/ai.service.js";

/**
 * POST /api/voice/transcribe  (multipart: audio)
 */
export const transcribe = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Audio file is required (field: audio)");

  const result = await transcribeAudio(req.file.buffer, req.file.mimetype);
  return sendSuccess(res, result, "Transcription complete");
});
