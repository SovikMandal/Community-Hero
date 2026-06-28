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
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(email) {
  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"Cityguardian" <${process.env.SMTP_USER}>`,
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
 * Reuses the shared SMTP transporter configured above.
 */
export async function sendPasswordResetEmail(email, resetUrl) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"Cityguardian" <${process.env.SMTP_USER}>`,
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
