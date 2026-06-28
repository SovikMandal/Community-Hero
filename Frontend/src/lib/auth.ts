// Authentication: register, login, session restore, logout.
// Tokens persist in localStorage; refresh token enables silent re-auth on expiry.

import { api, request, setToken, getToken, setRefreshToken, getRefreshToken } from "./api";
import type { AuthResult, User } from "./types";

const USER_KEY = "civicai.user";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  latitude?: number;
  longitude?: number;
  avatar?: string | null;
  avatarFile?: File | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

function cacheUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

export function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

/** True when the user holds the ADMIN role. */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/** True when the user holds any of the given roles. */
export function hasRole(user: User | null | undefined, ...roles: User["role"][]): boolean {
  return Boolean(user && roles.includes(user.role));
}

export async function register(input: RegisterInput): Promise<User> {
  const { avatar, avatarFile, ...payload } = input;
  const { user, token, refreshToken } = await api.post<AuthResult>("/auth/register", payload);
  setToken(token);
  setRefreshToken(refreshToken);

  // Upload avatar if provided
  if (avatarFile) {
    try {
      const updated = await uploadAvatar(avatarFile);
      cacheUser(updated);
      return updated;
    } catch { /* avatar upload failed — continue with user without avatar */ }
  }

  cacheUser(user);
  return user;
}

export async function login(input: LoginInput): Promise<User> {
  const { user, token, refreshToken } = await api.post<AuthResult>("/auth/login", input);
  setToken(token);
  setRefreshToken(refreshToken);
  const previous = getCachedUser();
  const merged: User =
    previous && previous.id === user.id
      ? { ...user, avatar: user.avatar ?? previous.avatar ?? null }
      : user;
  cacheUser(merged);
  return merged;
}

/** Starts the Google OAuth 2.0 redirect flow. The browser leaves the SPA and
 *  goes to Google's "Choose an account" screen; after consent, Google → backend
 *  → back to /auth/callback with the session tokens. (Full-page navigation.) */
export function beginGoogleAuth(): void {
  window.location.href = "/api/auth/google";
}

/** Uploads a new profile photo, persists it on the backend, and returns the
 *  updated user. The photo is stored on Cloudinary and its URL saved in the DB. */
export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("avatar", file);
  const { user } = await request<{ user: User }>("/auth/avatar", { method: "PATCH", form });
  const previous = getCachedUser();
  const merged: User =
    previous && previous.id === user.id ? { ...previous, ...user } : user;
  cacheUser(merged);
  return merged;
}

/** Fetch the current user from the token. Returns null if not authenticated. */
export async function fetchCurrentUser(): Promise<User | null> {
  if (!getToken() && !getRefreshToken()) return null;
  try {
    const { user } = await api.get<{ user: User }>("/auth/me");
    const previous = getCachedUser();
    const merged: User =
      previous && previous.id === user.id
        ? { ...user, avatar: user.avatar ?? previous.avatar ?? null }
        : user;
    cacheUser(merged);
    return merged;
  } catch {
    // Token invalid/expired and refresh also failed — clear session.
    logout();
    return null;
  }
}

export function logout(): void {
  // Best-effort server-side revocation
  if (getToken()) {
    api.post("/auth/logout").catch(() => {});
  }
  setToken(null);
  setRefreshToken(null);
  cacheUser(null);
}

/** Requests a password-reset email. Throws ApiError if the email is unknown. */
export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

/** Sets a new password using the token from the reset-link email. */
export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/auth/reset-password", { token, password });
}
