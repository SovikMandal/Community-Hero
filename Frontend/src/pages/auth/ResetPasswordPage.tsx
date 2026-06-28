import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import { InputField } from "./components/InputField";
import { GridBackground } from "../../components/GridBackground";
import { ApiError, resetPassword } from "../../lib";

interface ResetPasswordPageProps {
  isDark?: boolean;
}

export function ResetPasswordPage({ isDark = false }: ResetPasswordPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setLoading(false);
      setDone(true);
      // Redirect to the landing page after a short confirmation.
      setTimeout(() => navigate("/", { replace: true }), 1600);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const textPrimary = isDark ? "#E2E8F0" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <GridBackground isDark={isDark} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ color: textPrimary }}>Cityguardian</span>
        </div>

        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: isDark ? "#000000" : "rgba(255,255,255,0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.90)",
            boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.30)" : "0 8px 40px rgba(15,23,42,0.10)",
          }}
        >
          {/* Success overlay */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center z-20 backdrop-blur text-center px-6"
                style={{ background: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <p className="font-bold text-xl" style={{ color: textPrimary }}>Password updated!</p>
                <p className="text-sm mt-1" style={{ color: textSecondary }}>Taking you to the home page…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!token ? (
            /* Missing/invalid token */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="font-bold text-2xl mb-1" style={{ color: textPrimary }}>Invalid reset link</h2>
              <p className="text-sm mb-6" style={{ color: textSecondary }}>
                This password reset link is missing its token or is malformed. Please request a new one.
              </p>
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
                style={{ background: "#2563EB" }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-bold text-2xl mb-1" style={{ color: textPrimary }}>Set a new password</h2>
                <p className="text-sm" style={{ color: textSecondary }}>
                  Choose a strong password you haven't used before.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="rounded-2xl px-4 py-3 text-sm font-medium"
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <InputField
                  isDark={isDark}
                  icon={Lock}
                  label="New Password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  required
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <InputField
                  isDark={isDark}
                  icon={Lock}
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={setConfirm}
                  required
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                  style={{
                    background: "#2563EB",
                    color: "white",
                    opacity: loading ? 0.8 : 1,
                    boxShadow: "0 4px 16px rgba(37,99,235,0.30)",
                  }}
                >
                  {loading ? (
                    <motion.div
                      className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                    />
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
