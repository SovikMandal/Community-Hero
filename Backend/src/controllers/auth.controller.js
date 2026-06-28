// Auth controller: register, login, refresh, logout, current user.
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { signToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import { uploadAvatar } from "../services/cloudinary.service.js";
import { sendPasswordResetEmail } from "../services/otp.service.js";
import { env, isProd } from "../config/env.js";
import { isGoogleAuthEnabled, getGoogleAuthUrl, getGoogleProfile } from "../config/google.js";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6).max(100),
});

// How long a password-reset link stays valid
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Hash a raw reset token before storing it, so a DB leak can't be used to reset accounts.
function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function publicUser(user) {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

async function generateTokens(user) {
  const accessToken = signToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  return { token: accessToken, refreshToken };
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict("Email already registered");

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
  });

  const tokens = await generateTokens(user);
  return sendCreated(res, { user: publicUser(user), ...tokens }, "Registration successful");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized("Invalid credentials");

  // Accounts created via Google have no local password set.
  if (!user.password) {
    throw ApiError.badRequest("This account uses Google Sign-In. Continue with Google instead.");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw ApiError.unauthorized("Invalid credentials");

  const tokens = await generateTokens(user);
  return sendSuccess(res, { user: publicUser(user), ...tokens }, "Login successful");
});

// ── Google Sign-In (OAuth 2.0 authorization-code flow) ──────────────────────

// Short-lived cookie holding the anti-CSRF state nonce between the redirect to
// Google and the callback.
const OAUTH_STATE_COOKIE = "g_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Minimal cookie-header parser (we don't use cookie-parser middleware).
function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const i = c.indexOf("=");
        return i === -1 ? [c, ""] : [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
      })
  );
}

// Where the browser is sent after the callback finishes. Tokens (or an error)
// are passed in the URL hash so they aren't sent to servers or logged.
function frontendCallback(params) {
  const hash = new URLSearchParams(params).toString();
  return `${env.clientUrl}/auth/callback#${hash}`;
}

// Finds an existing account (by Google id, then email) or creates a new one.
// Links Google to a pre-existing email/password account on first Google sign-in.
async function loginOrCreateGoogleUser(payload) {
  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = payload.name || email.split("@")[0];
  const picture = payload.picture || null;

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { name, email, googleId, avatar: picture },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatar: user.avatar ?? picture },
    });
  }

  return user;
}

/**
 * GET /api/auth/google
 * Starts the OAuth 2.0 flow: sets a CSRF state cookie and redirects the browser
 * to Google's "Choose an account" consent screen.
 */
export const googleStart = asyncHandler(async (req, res) => {
  if (!isGoogleAuthEnabled()) {
    return res.redirect(
      frontendCallback({ error: "Google Sign-In is not configured on the server." })
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax", // sent on the top-level redirect back from Google
    secure: isProd,
    maxAge: OAUTH_STATE_TTL_MS,
    path: "/",
  });

  return res.redirect(getGoogleAuthUrl(state));
});

/**
 * GET /api/auth/google/callback
 * Google redirects here with `code` + `state`. We verify state, exchange the
 * code for the user's profile, sign them in (creating/linking the account),
 * then redirect back to the frontend with the session tokens in the URL hash.
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  // Always clear the state cookie once we reach the callback.
  const cookies = parseCookies(req.headers.cookie);
  const expectedState = cookies[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/" });

  if (oauthError) {
    return res.redirect(frontendCallback({ error: "Google sign-in was cancelled." }));
  }
  if (!code || !state) {
    return res.redirect(frontendCallback({ error: "Invalid response from Google." }));
  }
  if (!expectedState || expectedState !== state) {
    return res.redirect(frontendCallback({ error: "Security check failed. Please try again." }));
  }

  let payload;
  try {
    payload = await getGoogleProfile(code);
  } catch {
    return res.redirect(frontendCallback({ error: "Could not verify your Google sign-in." }));
  }

  if (!payload?.email || payload.email_verified !== true) {
    return res.redirect(frontendCallback({ error: "Your Google email is not verified." }));
  }

  const user = await loginOrCreateGoogleUser(payload);
  const { token, refreshToken } = await generateTokens(user);

  return res.redirect(frontendCallback({ token, refreshToken }));
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.unauthorized("Refresh token required");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized("Refresh token revoked");
  }

  const tokens = await generateTokens(user);
  return sendSuccess(res, { user: publicUser(user), ...tokens }, "Token refreshed");
});

export const logoutUser = asyncHandler(async (req, res) => {
  // Clear the stored refresh token to revoke it
  await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
  return sendSuccess(res, null, "Logged out");
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user }, "Current user");
});

/**
 * PATCH /api/auth/avatar
 * Uploads a profile photo to Cloudinary and stores the secure URL on the user.
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("No image provided (field name: avatar)");

  const { url } = await uploadAvatar(req.file);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: url },
  });

  return sendSuccess(res, { user: publicUser(user) }, "Profile photo updated");
});


/**
 * POST /api/auth/forgot-password
 * Looks up the user by email and, if found, emails a one-time reset link.
 * Per product requirement, an unknown email returns a 404 error.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.notFound("No account found with that email address");

  // Generate a random token; store only its hash + an expiry on the user.
  const rawToken = crypto.randomBytes(32).toString("hex");
  const resetToken = hashResetToken(rawToken);
  const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Roll back the token so a failed send doesn't leave a dangling reset state.
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    throw ApiError.internal("Failed to send reset email. Check SMTP configuration.");
  }

  return sendSuccess(res, null, "Password reset link sent to your email");
});

/**
 * POST /api/auth/reset-password
 * Validates the reset token, sets the new password, and clears the token.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const hashed = hashResetToken(token);
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashed,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");

  const newPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null,
      refreshToken: null, // revoke existing sessions after a password change
    },
  });

  return sendSuccess(res, null, "Password updated successfully. You can now sign in.");
});
