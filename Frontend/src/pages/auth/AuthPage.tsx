import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  ChevronLeft,
  CheckCircle2,
  Zap,
  MapPin,
  Camera,
  X,
} from "lucide-react";
import { GoogleIcon } from "./components/GoogleIcon";
import { InputField } from "./components/InputField";
import { GridBackground } from "../../components/GridBackground";
import { ApiError, otp as otpApi, forgotPassword, type RegisterInput } from "../../lib";

interface AuthPageProps {
  isDark?: boolean;
  onBack: () => void;
  onEnter: () => void;
  onLogin: (email: string, password: string, asAdmin?: boolean) => Promise<void>;
  onAdminLoginRequest: (email: string, password: string) => Promise<void>;
  onAdminLoginVerify: (email: string, otp: string) => Promise<void>;
  onRegister: (input: RegisterInput) => Promise<void>;
  onGoogle: () => void;
}

export function AuthPage({ isDark = false, onBack, onEnter, onLogin, onAdminLoginRequest, onAdminLoginVerify, onRegister, onGoogle }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "signup" | "admin">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState<null | "google" | "form" | "guest">(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", confirm: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Distinguishes the email-verification OTP (signup) from the admin 2FA OTP.
  const [otpMode, setOtpMode] = useState<"signup" | "admin">("signup");

  // Forgot-password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const openForgot = () => {
    setForgotEmail(form.email);
    setForgotError(null);
    setForgotSent(false);
    setShowForgot(true);
  };

  const handleForgotSubmit = async () => {
    setForgotError(null);
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotLoading(false);
      setForgotSent(true);
    } catch (err) {
      setForgotLoading(false);
      setForgotError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const handleAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your profile photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must be under 5 MB.");
      return;
    }
    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatar((e.target?.result as string) ?? null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "signup") {
      if (form.name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (form.password !== form.confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setLoading("form");
    try {
      if (tab === "login") {
        await onLogin(form.email, form.password);
        setLoading(null);
        setDone(true);
        setTimeout(onEnter, 900);
      } else if (tab === "admin") {
        // Admin 2FA: validate credentials server-side, then email an OTP and
        // open the verification modal. The session is only created on verify.
        await onAdminLoginRequest(form.email, form.password);
        setLoading(null);
        setOtpMode("admin");
        setOtpCode("");
        setOtpError(null);
        setShowOtp(true);
      } else {
        // Send OTP for email verification before registration
        await otpApi.send(form.email);
        setLoading(null);
        setOtpMode("signup");
        setShowOtp(true);
      }
    } catch (err) {
      setLoading(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    setOtpLoading(true);
    try {
      if (otpMode === "admin") {
        // Confirm the admin 2FA code; this establishes the admin session.
        await onAdminLoginVerify(form.email, otpCode);
      } else {
        await otpApi.verify(form.email, otpCode);
        await onRegister({ name: form.name, email: form.email, password: form.password, avatar, avatarFile });
      }
      setOtpLoading(false);
      setShowOtp(false);
      setDone(true);
      setTimeout(onEnter, 900);
    } catch (err) {
      setOtpLoading(false);
      setOtpError(err instanceof ApiError ? err.message : "Verification failed. Try again.");
    }
  };

  const handleGoogle = () => {
    // Full-page redirect to Google's OAuth 2.0 consent screen. Control returns
    // to /auth/callback (handled by GoogleCallbackPage) once the user signs in.
    setError(null);
    setLoading("google");
    onGoogle();
  };

  return (
    <div
      className="min-h-screen w-full flex overflow-x-hidden relative"
      style={{ fontFamily: "Inter, sans-serif", scrollbarWidth: "none" }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      <GridBackground isDark={isDark} />
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] min-h-screen p-12 relative overflow-hidden z-10"
        style={{ background: "linear-gradient(145deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)" }}
      >
        {/* Soft circle decoration */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03] pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2.5 relative"
        >
          <div className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Cityguardian</span>
        </motion.div>

        {/* Center copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 border border-white/20 rounded-2xl mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold">Live across 48 cities</span>
          </div>

          <h1
            className="text-white font-bold mb-5 leading-tight"
            style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
          >
            Your city.
            <br />
            Your voice.
            <br />
            <span className="text-blue-200">Your responsibility.</span>
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs">
            Join 8,400+ citizens using AI to report, verify, and resolve community issues — faster than ever.
          </p>

          {/* Mini stat cards */}
          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: MapPin, value: "14,289", label: "Reported" },
              { icon: CheckCircle2, value: "11,021", label: "Resolved" },
              { icon: Zap, value: "97%", label: "AI Accuracy" },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <Icon className="w-4 h-4 text-blue-200 mx-auto mb-2" />
                <p className="text-white font-bold text-lg leading-none mb-1">{value}</p>
                <p className="text-blue-200 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom avatars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3 relative"
        >
          <div className="flex -space-x-2">
            {[
              "photo-1494790108755-2616b612b47c",
              "photo-1507003211169-0a1dd7228f2d",
              "photo-1438761681033-6461ffad8d80",
              "photo-1472099645785-5658abf4ff4e",
            ].map((id) => (
              <div key={id} className="w-8 h-8 rounded-full border-2 border-blue-600 overflow-hidden">
                <img
                  src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop`}
                  alt="citizen"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="text-blue-100 text-xs font-medium">
            <strong className="text-white">8,400+</strong> active community heroes
          </p>
        </motion.div>
      </div>

      {/* ── Right panel — auth form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 transition-colors text-sm font-medium group"
          style={{ color: isDark ? "#94A3B8" : "#64748B" }}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </motion.button>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>Cityguardian</span>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="w-full max-w-md relative"
        >
          {/* Glassmorphism card */}
          <div
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background: isDark ? "#000000" : "rgba(255,255,255,0.80)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.90)",
              boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.30)" : "0 8px 40px rgba(15,23,42,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
            }}
          >
            {/* Success overlay */}
            <AnimatePresence>
              {done && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center z-20 backdrop-blur"
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
                  <p className="font-bold text-xl" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>Welcome aboard!</p>
                  <p className="text-sm mt-1" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Redirecting you now…</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab toggle */}
            <div className="flex mb-8 p-1 rounded-2xl" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9" }}>
              {(["login", "signup", "admin"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors capitalize"
                  style={{
                    color: tab === t ? (isDark ? "#E2E8F0" : "#0F172A") : (isDark ? "#94A3B8" : "#64748B"),
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-xl shadow-sm"
                      style={{ background: isDark ? "rgba(255,255,255,0.10)" : "#FFFFFF" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{t === "login" ? "Sign In" : t === "signup" ? "Sign Up" : "Admin"}</span>
                </button>
              ))}
            </div>

            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-6"
              >
                <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: "Inter, sans-serif", color: isDark ? "#E2E8F0" : "#0F172A" }}>
                  {tab === "login" ? "Welcome back" : tab === "signup" ? "Join the movement" : "Admin Panel"}
                </h2>
                <p className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  {tab === "login"
                    ? "Sign in to report and track community issues."
                    : tab === "signup"
                    ? "Create an account and start making a difference."
                    : "Sign in with your admin credentials."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
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
              {/* Profile photo (signup only) */}
              <AnimatePresence>
                {tab === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col items-center gap-2 pb-1">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all"
                          style={{
                            background: avatar ? "transparent" : "#EFF6FF",
                            border: `2px dashed ${avatar ? "transparent" : "#BFDBFE"}`,
                          }}
                          aria-label="Upload profile photo"
                        >
                          {avatar ? (
                            <img src={avatar} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-blue-400" />
                          )}
                        </button>

                        {/* Camera badge */}
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md"
                          style={{ background: "#2563EB", border: "2px solid #FFFFFF" }}
                          aria-label="Choose photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove badge */}
                        {avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatar(null);
                              if (avatarInputRef.current) avatarInputRef.current.value = "";
                            }}
                            className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md"
                            style={{ background: "#EF4444", border: "2px solid #FFFFFF" }}
                            aria-label="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs font-medium" style={{ color: "#64748B" }}>
                        {avatar ? "Looking good! Tap to change." : "Add a profile photo (optional)"}
                      </p>

                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatar(e.target.files?.[0])}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {tab === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <InputField
                      isDark={isDark}
                      icon={User}
                      label="Full Name"
                      type="text"
                      placeholder="Priya Sharma"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                      isDark={isDark}
                icon={Mail}
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
                autoComplete={tab === "signup" ? "email" : "off"}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: isDark ? "#94A3B8" : "#475569" }}>
                    Password
                  </label>
                  {(tab === "login" || tab === "admin") && (
                    <button type="button" onClick={openForgot} className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <InputField
                      isDark={isDark}
                  icon={Lock}
                  label=""
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  required
                  autoComplete="new-password"
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
              </div>

              <AnimatePresence>
                {tab === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <InputField
                      isDark={isDark}
                      icon={Lock}
                      label="Confirm Password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={(v) => setForm({ ...form, confirm: v })}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading !== null}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                style={{
                  background: "#2563EB",
                  color: "white",
                  opacity: loading === "form" ? 0.8 : 1,
                  boxShadow: "0 4px 16px rgba(37,99,235,0.30)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {loading === "form" ? (
                  <motion.div
                    className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                  />
                ) : (
                  <>
                  {tab === "login" ? "Sign In" : tab === "admin" ? "Sign In" : "Sign Up"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            {tab !== "admin" && (<>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all mb-3"
              style={{
                background: "#FFFFFF",
                color: "#374151",
                border: "1px solid rgba(15,23,42,0.12)",
                boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading === "google" ? (
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-blue-600"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                />
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </motion.button>
            </>)}

            {tab === "signup" && (
              <p className="text-center text-slate-400 text-xs mt-5 leading-relaxed">
                By signing up, you agree to our{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            )}
          </div>

          {/* Below card — switch tab nudge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm mt-5"
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
          >
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === "login" ? "signup" : "login")}
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {tab === "login" ? "Create one" : "Sign in"}
            </button>
          </motion.p>
        </motion.div>
      </div>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOtp && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{ background: isDark ? "#000000" : "#FFFFFF", border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #E2E8F0" }}
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF" }}>
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-xl mb-1" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>{otpMode === "admin" ? "Admin verification" : "Verify your email"}</h3>
              <p className="text-sm mb-6" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                We sent a 6-digit code to <strong style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>{form.email}</strong>
              </p>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border outline-none py-4 mb-4"
                style={{
                  background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                  borderColor: isDark ? "rgba(255,255,255,0.16)" : "#E2E8F0",
                  color: isDark ? "#E2E8F0" : "#0F172A",
                }}
                autoFocus
              />
              {otpError && (
                <p className="text-sm mb-3" style={{ color: "#DC2626" }}>{otpError}</p>
              )}
              <button
                onClick={handleVerifyOtp}
                disabled={otpCode.length < 6 || otpLoading}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white mb-3"
                style={{ background: "#2563EB", opacity: otpCode.length < 6 || otpLoading ? 0.6 : 1 }}
              >
                {otpLoading ? "Verifying..." : otpMode === "admin" ? "Verify & Sign In" : "Verify & Create Account"}
              </button>
              <button
                onClick={() => { setShowOtp(false); setOtpCode(""); setOtpError(null); }}
                className="text-sm font-medium"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-8"
              style={{ background: isDark ? "#000000" : "#FFFFFF", border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid #E2E8F0" }}
            >
              {forgotSent ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-xl mb-1" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>Check your email</h3>
                  <p className="text-sm mb-6" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                    We sent a password reset link to <strong style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>{forgotEmail}</strong>. The link expires in 30 minutes.
                  </p>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white"
                    style={{ background: "#2563EB" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF" }}>
                    <Lock className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-xl mb-1 text-center" style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}>Forgot password?</h3>
                  <p className="text-sm mb-6 text-center" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                    Enter your account email and we'll send you a link to reset your password.
                  </p>

                  {forgotError && (
                    <div
                      className="rounded-2xl px-4 py-3 text-sm font-medium mb-4"
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                    >
                      {forgotError}
                    </div>
                  )}

                  <InputField
                    isDark={isDark}
                    icon={Mail}
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                  />

                  <button
                    onClick={handleForgotSubmit}
                    disabled={forgotEmail.trim().length < 5 || forgotLoading}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm text-white mt-5 mb-3 flex items-center justify-center gap-2"
                    style={{ background: "#2563EB", opacity: forgotEmail.trim().length < 5 || forgotLoading ? 0.6 : 1 }}
                  >
                    {forgotLoading ? (
                      <motion.div
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                      />
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="w-full text-sm font-medium"
                    style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
