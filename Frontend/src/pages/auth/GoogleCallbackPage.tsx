// Lands here after Google → backend redirects back with the session tokens
// (or an error) in the URL hash: /auth/callback#token=...&refreshToken=...
// We store the tokens, load the user, and hand control back to the app.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { setToken, setRefreshToken, fetchCurrentUser, type User } from "../../lib";
import { GridBackground } from "../../components/GridBackground";

interface GoogleCallbackPageProps {
  isDark?: boolean;
  /** Called once the Google session is established and the user is loaded. */
  onAuthenticated: (user: User) => void;
}

export function GoogleCallbackPage({ isDark = false, onAuthenticated }: GoogleCallbackPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // React StrictMode runs effects twice in dev; this guard ensures we only
  // consume the one-time tokens from the URL hash a single time. (Otherwise the
  // second run sees an already-stripped hash and reports a false failure.)
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const raw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(raw);
    const err = params.get("error");
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    // Strip the tokens from the URL so they don't linger in history.
    window.history.replaceState(null, "", window.location.pathname);

    const bailToAuth = (message: string) => {
      setError(message);
      setTimeout(() => navigate("/auth", { replace: true }), 2200);
    };

    if (err) return bailToAuth(err);
    if (!token || !refreshToken) return bailToAuth("Google sign-in failed. Please try again.");

    setToken(token);
    setRefreshToken(refreshToken);

    fetchCurrentUser()
      .then((user) => {
        if (user) onAuthenticated(user);
        else bailToAuth("Could not load your profile. Please try again.");
      })
      .catch(() => bailToAuth("Could not load your profile. Please try again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <GridBackground isDark={isDark} />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
          <Shield className="w-6 h-6 text-white" />
        </div>

        {error ? (
          <>
            <p className="font-bold text-lg mb-1" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>
              Sign-in failed
            </p>
            <p className="text-sm max-w-xs" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              {error} Redirecting you back…
            </p>
          </>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-full border-2 mb-5 animate-spin"
              style={{ borderColor: "rgba(37,99,235,0.25)", borderTopColor: "#2563EB" }}
            />
            <p className="font-bold text-lg mb-1" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>
              Signing you in…
            </p>
            <p className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Finishing your Google sign-in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
