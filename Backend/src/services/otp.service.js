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

// Professional, email-client-safe OTP template (table layout + inline styles).
function buildOtpEmail(otp) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>Your Cityguardian verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">
    Use the verification code inside to confirm your email. It expires in 5 minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <span style="display:inline-block;width:36px;height:36px;background:#ffffff;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">&#128737;&#65039;</span>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Cityguardian</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 8px 0;color:#0f172a;font-size:22px;font-weight:700;">Verify your email</h1>
              <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
                Use the verification code below to continue. This code is valid for the next
                <strong style="color:#0f172a;">5 minutes</strong>.
              </p>

              <!-- OTP code -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                    <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2563eb;font-family:'Courier New',monospace;">${otp}</div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email &mdash; someone may
                have entered your address by mistake. Never share this code with anyone; Cityguardian
                staff will never ask for it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px 0;" />
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                &copy; ${year} Cityguardian &middot; Your city. Your voice. Your responsibility.<br />
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOtp(email) {
  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

  await sendEmail({
    to: email,
    subject: "Your Cityguardian verification code",
    html: buildOtpEmail(otp),
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
