import { z } from "zod";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";

const sendSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({ email: z.string().email(), otp: z.string().length(6) });

export const sendOtpHandler = asyncHandler(async (req, res) => {
  const { email } = sendSchema.parse(req.body);
  try {
    await sendOtp(email);
  } catch (err) {
    // Surface the real SMTP failure in the server logs (code, response, command)
    // while keeping the client-facing message generic.
    console.error("[otp.send] SMTP send failed:", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      responseCode: err?.responseCode,
      response: err?.response,
    });
    throw ApiError.internal("Failed to send OTP. Check SMTP configuration.");
  }
  return sendSuccess(res, null, "OTP sent to your email");
});

export const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { email, otp } = verifySchema.parse(req.body);
  const valid = verifyOtp(email, otp);
  if (!valid) throw ApiError.badRequest("Invalid or expired OTP");
  return sendSuccess(res, { verified: true }, "Email verified");
});
