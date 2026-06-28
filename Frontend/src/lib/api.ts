// Core HTTP client for the Community Hero backend.
// - Prefixes all calls with /api (proxied to the backend in dev via vite.config).
// - Injects the Bearer token from local storage.
// - Unwraps the backend's { success, message, data } envelope.
// - Auto-refreshes expired access tokens using the refresh token.

import type { ApiEnvelope, Pagination } from "./types";

const TOKEN_KEY = "civicai.token";
const REFRESH_TOKEN_KEY = "civicai.refreshToken";

// Backend origin for API calls. In dev this is empty, so requests use relative
// "/api/..." paths handled by the Vite proxy. In production set
// VITE_API_BASE_URL to the backend origin (e.g. https://your-api.onrender.com)
// so the frontend (on Vercel) talks to the backend directly. Trailing slashes
// are trimmed so we don't end up with a double slash.
const API_ORIGIN = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/+$/, "");

/** Builds a full API URL for the given path (prefixes the backend origin + /api). */
export function apiUrl(path: string): string {
  return `${API_ORIGIN}/api${path.startsWith("/") ? path : `/${path}`}`;
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
}

export function setRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch { /* ignore */ }
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  body?: Record<string, unknown>;

  constructor(message: string, status: number, details?: unknown, body?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  form?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  _retry?: boolean; // internal: prevents infinite refresh loops
}

export interface ApiResult<T> {
  data: T;
  message: string;
  pagination?: Pagination;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// Mutex to prevent multiple simultaneous refresh calls
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(apiUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      if (json?.success && json.data?.token) {
        setToken(json.data.token);
        if (json.data.refreshToken) setRefreshToken(json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function requestRaw<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, form, query, headers = {}, signal, _retry } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const url = `${apiUrl(path)}${buildQuery(query)}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers: finalHeaders, body: payload, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Network error — is the backend running?", 0, err);
  }

  // On 401, attempt a silent refresh and retry once
  if (res.status === 401 && !_retry && !path.includes("/auth/refresh")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return requestRaw<T>(path, { ...options, _retry: true });
    }
  }

  if (res.status === 204) {
    return { data: undefined as T, message: "No Content" };
  }

  let json: (ApiEnvelope<T> & Record<string, unknown>) | null = null;
  const text = await res.text();
  if (text) {
    try { json = JSON.parse(text); } catch { json = null; }
  }

  if (!res.ok || !json || json.success === false) {
    const message = json?.message ?? res.statusText ?? "Request failed";
    const details = json && "details" in json ? (json as Record<string, unknown>).details : undefined;
    throw new ApiError(message, res.status, details, json ?? undefined);
  }

  return { data: json.data, message: json.message, pagination: json.pagination };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const result = await requestRaw<T>(path, options);
  return result.data;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET", query }),
  getRaw: <T>(path: string, query?: RequestOptions["query"], opts?: RequestOptions) =>
    requestRaw<T>(path, { ...opts, method: "GET", query }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  postForm: <T>(path: string, form: FormData, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", form }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
