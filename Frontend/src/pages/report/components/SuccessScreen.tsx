import { motion } from "motion/react";
import { Eye, Copy } from "lucide-react";
import type { ReportTheme } from "../theme";
import { shortId, type Issue } from "../../../lib";

interface SuccessScreenProps {
  t: ReportTheme;
  isDark: boolean;
  createdIssue: Issue | null;
  onBack: () => void;
}

// Confirmation screen shown once a report is submitted successfully.
export function SuccessScreen({ t, isDark, createdIssue, onBack }: SuccessScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8" style={{ background: "transparent" }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
        className="rounded-3xl p-10 text-center max-w-sm w-full border"
        style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="text-5xl mb-5">🎉</motion.div>

        <h2 className="font-bold text-2xl mb-1.5" style={{ color: t.text }}>Report Submitted!</h2>
        <p className="text-sm mb-5" style={{ color: t.textSub }}>AI-verified and routed to the right department.</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="font-mono text-sm font-bold px-4 py-2 rounded-2xl text-blue-500"
            style={{ background: isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF" }}>
            {createdIssue ? shortId(createdIssue.id) : "CIV-—"}
          </span>
          <button className="p-2 rounded-xl transition-colors"
            style={{ background: t.tagBg, color: t.textSub }}>
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "AI Verified",   color: "#2563EB", bg: isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF" },
            { label: "Dept. Alerted", color: "#22C55E", bg: isDark ? "rgba(34,197,94,0.12)"  : "#F0FDF4" },
            { label: "ETA: 48 hrs",   color: "#F59E0B", bg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB" },
          ].map(({ label, color, bg }) => (
            <div key={label} className="rounded-2xl py-3 px-2 text-center" style={{ background: bg }}>
              <p className="text-xs font-bold" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF", color: "#2563EB" }}>
            <Eye className="w-4 h-4" /> Track Status
          </motion.button>
          <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
            Back to Dashboard
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
