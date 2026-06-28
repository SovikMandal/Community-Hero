import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Upload, Sparkles, Eye, Search, Building2, Zap, BarChart3, CheckCircle2,
} from "lucide-react";
import { tk } from "../theme";

const aiSteps = [
  { label: "Uploading to CivicMind...",  icon: Upload,       color: "#2563EB" },
  { label: "Gemini Vision analyzing...", icon: Sparkles,     color: "#8B5CF6" },
  { label: "Detecting issue type...",    icon: Eye,          color: "#2563EB" },
  { label: "Checking duplicates...",     icon: Search,       color: "#F59E0B" },
  { label: "Assigning department...",    icon: Building2,    color: "#22C55E" },
  { label: "Analyzing severity...",      icon: Zap,          color: "#EF4444" },
  { label: "Generating summary...",      icon: BarChart3,    color: "#8B5CF6" },
  { label: "Analysis complete — 98%",   icon: CheckCircle2, color: "#22C55E" },
];

// Animated multi-step "AI is thinking" sequence shown on step 2.
export function AIAnalysisFlow({ isDark, onDone }: { isDark: boolean; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const t = tk(isDark);
  useEffect(() => {
    if (idx >= aiSteps.length - 1) { setTimeout(onDone, 600); return; }
    const timer = setTimeout(() => setIdx(s => s + 1), idx === 0 ? 500 : 550);
    return () => clearTimeout(timer);
  }, [idx, onDone]);
  const cur = aiSteps[idx];
  const Icon = cur.icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <motion.div key={idx} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: `${cur.color}18` }}>
        <Icon className="w-10 h-10" style={{ color: cur.color }} />
      </motion.div>
      <motion.p key={`l-${idx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="font-bold text-lg mb-8 text-center" style={{ color: t.text }}>
        {cur.label}
      </motion.p>
      <div className="flex gap-2 mb-8">
        {aiSteps.map((s, i) => (
          <motion.div key={i}
            animate={{ width: i === idx ? 28 : 8, background: i < idx ? "#22C55E" : i === idx ? s.color : (isDark ? "#334155" : "#E2E8F0") }}
            className="h-2 rounded-full" />
        ))}
      </div>
      <div className="w-full max-w-sm space-y-2">
        {aiSteps.slice(0, idx).map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-green-600">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
