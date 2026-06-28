import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { tk } from "../theme";

const stepLabels = ["Upload", "AI Analysis", "Review"];

// Sticky top bar + 3-step progress indicator for the report wizard.
export function StepHeader({
  step, onBack, onPrev, isDark,
}: {
  step: 1 | 2 | 3;
  onBack: () => void;
  onPrev: () => void;
  isDark: boolean;
}) {
  const t = tk(isDark);
  return (
    <>
      {/* Top bar */}
      <div className="px-5 md:px-8 pt-5 pb-4 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-xl flex-shrink-0"
        style={{ borderBottom: `1px solid ${t.divider}`, background: isDark ? "rgba(11,17,32,0.92)" : "rgba(240,245,255,0.92)" }}>
        <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
          onClick={step === 1 ? onBack : onPrev}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold flex-shrink-0"
          style={{ background: t.tagBg, color: t.textSub }}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{step === 1 ? "Back" : "Previous"}</span>
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-none" style={{ color: t.text }}>Report an Issue</h1>
          <p className="text-xs mt-0.5" style={{ color: t.textSub }}>Step {step} of 3 — {stepLabels[step - 1]}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="px-5 md:px-8 py-4 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center">
          {[1, 2, 3].map((num, i) => {
            const active = num === step, done = num < step;
            return (
              <div key={num} className="flex items-center" style={{ flex: i < 2 ? 1 : undefined }}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.div animate={{
                    background: done ? "#22C55E" : active ? "#2563EB" : (isDark ? "#1E293B" : "#E2E8F0"),
                    boxShadow: active ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                  }} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ color: done || active ? "white" : t.textMuted }}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : num}
                  </motion.div>
                  <span className="text-xs font-semibold hidden sm:inline"
                    style={{ color: done ? "#22C55E" : active ? "#2563EB" : t.textMuted }}>
                    {stepLabels[i]}
                  </span>
                </div>
                {i < 2 && (
                  <motion.div animate={{ background: num < step ? "#22C55E" : (isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0") }}
                    className="flex-1 h-0.5 rounded-full mx-3" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
