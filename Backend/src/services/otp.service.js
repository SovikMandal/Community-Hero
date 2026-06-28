import nodemailer from "nodemailer";

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Fail fast instead of hanging the HTTP request if the SMTP host/port is
  // blocked or unreachable in production (common on some hosting platforms).
  connectionTimeout: 10_000, // 10s to establish the TCP connection
  greetingTimeout: 10_000, // 10s to receive the SMTP greeting
  socketTimeout: 15_000, // 15s of inactivity on the socket
});

// Parse MAIL_FROM ("Name <email>" or "email") into Brevo's { name, email } shape.
function parseSender() {
  const raw = process.env.MAIL_FROM || process.env.SMTP_USER || "";
  const match = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || "Cityguardian", email: match[2].trim() };
  return { name: "Cityguardian", email: raw.trim() };
}

/**
 * Sends an email. Prefers Brevo's HTTP API (works on hosts that block outbound
 * SMTP ports, e.g. Render's free tier) and falls back to SMTP when no
 * BREVO_API_KEY is configured (e.g. local development).
 */
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (apiKey) {
    const sender = parseSender();
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }
    return true;
  }

  // Fallback: SMTP (local/dev or hosts that allow outbound SMTP).
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"Cityguardian" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(email) {
  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

  await sendEmail({
    to: email,
    subject: "Your CivicAI Verification Code",
    html: `<div style="font-family:sans-serif;padding:20px"><h2>Verification Code</h2><p>Your OTP is:</p><h1 style="letter-spacing:8px;color:#2563EB">${otp}</h1><p>This code expires in 5 minutes.</p></div>`,
  });

  return true;
}

export function verifyOtp(email, otp) {
  const entry = otpStore.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(email); return false; }
  if (entry.otp !== otp) return false;
  otpStore.delete(email);
  return true;
}

/**
 * Sends a password-reset email containing a one-time link.
 * Uses the shared sendEmail() helper (Brevo HTTP API with SMTP fallback).
 */
export async function sendPasswordResetEmail(email, resetUrl) {
  await sendEmail({
    to: email,
    subject: "Reset your Cityguardian password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F172A">Reset your password</h2>
        <p style="color:#475569">We received a request to reset the password for your Cityguardian account. Click the button below to choose a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563EB;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Reset Password</a>
        <p style="color:#94A3B8;font-size:13px">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#94A3B8;font-size:12px;word-break:break-all">Or paste this link into your browser:<br/>${resetUrl}</p>
      </div>`,
  });
  return true;
}
