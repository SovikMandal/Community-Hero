import { motion } from "motion/react";
import {
  Camera, Sparkles, Building2, ArrowRight, FileText, Copy,
  Check, CheckCircle2, ArrowLeft, Workflow, HelpCircle, TrendingUp,
} from "lucide-react";
import type { ReportTheme } from "../theme";
import { AIAnalysisFlow } from "./AIAnalysisFlow";

interface AIAnalysisStepProps {
  t: ReportTheme;
  isDark: boolean;
  analyzing: boolean;
  aiDone: boolean;
  analyzeError: string | null;
  image: string | null;
  imageName: string;
  location: string;
  description: string;
  setDescription: (v: string) => void;
  sevColor: string;
  severityLabel: string;
  issueTypeLabel: string;
  departmentLabel: string;
  dupCount: number;
  summaryText: string;
  priorityScore: number;
  priorityLevel: string;
  riskLabel: string;
  onBack: () => void;
  onNext: () => void;
}

// Slide 2 — surfaces the Gemini Vision analysis results for the report.
export function AIAnalysisStep({
  t, isDark, analyzing, aiDone, analyzeError, image, imageName, location,
  description, setDescription, sevColor, severityLabel, issueTypeLabel, departmentLabel,
  dupCount, summaryText, priorityScore, priorityLevel, riskLabel, onBack, onNext,
}: AIAnalysisStepProps) {
  return (
    <motion.div key="s2"
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto w-full px-5 md:px-0 pb-28 sm:pb-8 pt-2">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-bold text-xl" style={{ color: t.text }}>🤖 CivicMind AI Analysis</h1>
          <p className="text-sm" style={{ color: t.textSub }}>Gemini Vision has analyzed your image. Here are the results.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: t.tagBg, color: t.textSub }}>Step 2 of 3</span>
      </div>

      {analyzeError && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium mb-4"
          style={{ background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2", color: "#DC2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#FECACA"}` }}>
          {analyzeError}
        </div>
      )}
      {analyzing ? (
        <div className="rounded-3xl border overflow-hidden" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563EB,#3B82F6,#60A5FA)" }} />
          <AIAnalysisFlow isDark={isDark} onDone={() => {}} />
        </div>
      ) : aiDone ? (
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Image card */}
            <div className="rounded-xl border overflow-hidden" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="relative w-full h-52 overflow-hidden" style={{ background: t.lockedBg }}>
                {image ? (
                  <img src={image} alt="Evidence" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: t.textMuted }}><Camera className="w-8 h-8" /></div>
                )}
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(15,23,42,0.8)", color: "white" }}>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Analysis Complete
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: t.lockedBg }}>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs truncate" style={{ color: t.textSub }}>{location} · Uploaded just now</span>
                <span className="ml-auto text-xs font-medium text-blue-500 truncate max-w-[120px]">{imageName || "evidence.jpg"}</span>
              </div>
            </div>

            {/* Detection card */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke={isDark ? "rgba(255,255,255,0.10)" : "#E5E7EB"} strokeWidth="7" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={sevColor} strokeWidth="7" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset={213.6 * (1 - priorityScore / 100)} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black" style={{ color: sevColor }}>{priorityScore}</span>
                    <span className="text-[9px] font-semibold" style={{ color: t.textMuted }}>score</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-base font-bold block mb-1" style={{ color: t.text }}>{issueTypeLabel} Detected</span>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${sevColor}1A`, color: sevColor, border: `1px solid ${sevColor}33` }}>{severityLabel}</span>
                    <span className="text-xs" style={{ color: t.textSub }}>Severity Level</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>{issueTypeLabel}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${sevColor}1A`, color: sevColor }}>{priorityLevel} priority</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <span className="text-sm font-bold" style={{ color: t.text }}>AI Summary</span>
                <Sparkles className="w-3.5 h-3.5 text-blue-500 ml-auto" />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>{summaryText}</p>
            </div>

            {/* Agent Workflow */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold" style={{ color: t.text }}>⚡ Agent Workflow</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#15803D" }}>Done</span>
              </div>
              <div className="flex flex-col gap-2">
                {["Gemini Vision Analysis", "Category Detection", "Duplicate Detection", "Priority Scoring", "Department Routing", "Summary Generation"].map((label) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-green-500" />
                    <div className="flex-1 h-px" style={{ background: "rgba(34,197,94,0.3)" }} />
                    <span className="text-xs font-medium" style={{ color: t.text }}>{label}</span>
                    <Check className="w-3.5 h-3.5 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Critical severity */}
            <div className="rounded-xl border p-4" style={{ background: isDark ? "rgba(239,68,68,0.08)" : "#FEF2F2", borderColor: isDark ? "rgba(239,68,68,0.25)" : "#FECACA" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: isDark ? "#F87171" : "#B91C1C" }}>🔴 {severityLabel} Severity</span>
                <button className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline"><HelpCircle className="w-3 h-3" /> Why?</button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {[
                  `Classified as ${issueTypeLabel} by Gemini Vision analysis`,
                  `Severity assessed ${severityLabel} · priority ${priorityLevel}`,
                  dupCount > 0 ? `${dupCount} similar report(s) found within ~75m` : "No nearby duplicates detected",
                ].map(txt => (
                  <div key={txt} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-xs" style={{ color: t.text }}>{txt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
                <div className="flex items-center gap-2 mb-1"><Copy className="w-3.5 h-3.5" style={{ color: t.textMuted }} /><span className="text-xs font-semibold" style={{ color: t.textSub }}>Duplicate Reports</span></div>
                <div className="text-3xl font-black leading-none" style={{ color: t.text }}>{dupCount} <span className="text-base font-semibold" style={{ color: t.textSub }}>nearby</span></div>
                <p className="text-xs mt-1" style={{ color: t.textSub }}>same category · within ~75m</p>
                <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: dupCount > 0 ? (isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.12)") : (isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.12)"), color: dupCount > 0 ? "#B45309" : "#15803D" }}>{dupCount > 0 ? "Merge Recommended" : "No duplicates"}</span>
              </div>
              <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5" style={{ color: t.textMuted }} /><span className="text-xs font-semibold" style={{ color: t.textSub }}>Priority Score</span></div>
                <div className="text-3xl font-black leading-none" style={{ color: sevColor }}>{priorityScore}<span className="text-base font-semibold" style={{ color: t.textSub }}>/100</span></div>
                <p className="text-xs mt-1" style={{ color: t.textSub }}>computed from severity + context</p>
                <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${sevColor}1A`, color: sevColor }}>{priorityLevel}</span>
              </div>
            </div>

            {/* Department */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold" style={{ color: t.text }}>🏢 Assigned Department</span></div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>Auto-routed</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <span className="text-xs" style={{ color: t.textSub }}>Department</span>
                  <span className="text-xs font-bold" style={{ color: t.text }}>{departmentLabel}</span>
                </div>
                <div className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${t.divider}` }}>
                  <span className="text-xs" style={{ color: t.textSub }}>Officer</span>
                  <span className="text-xs font-bold" style={{ color: t.text }}>Auto-assigned</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs" style={{ color: t.textSub }}>Risk level</span>
                  <span className="text-xs font-bold" style={{ color: sevColor }}>{riskLabel}</span>
                </div>
              </div>
            </div>

            {/* AI Prediction */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold" style={{ color: t.text }}>🔮 Risk Assessment</span></div>
              <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>
                Gemini assessed an escalation risk of <span className="font-bold" style={{ color: sevColor }}>{riskLabel}</span>{dupCount > 0 ? <>, reinforced by <span className="font-bold" style={{ color: t.text }}>{dupCount} nearby duplicate{dupCount > 1 ? "s" : ""}</span></> : ""}. Computed priority score is <span className="font-bold" style={{ color: t.text }}>{priorityScore}/100</span>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: t.tagBg }}>
                  <div className="h-full rounded-full" style={{ width: `${priorityScore}%`, background: `linear-gradient(to right,#2563EB,${sevColor})` }} />
                </div>
                <span className="text-xs font-bold" style={{ color: sevColor }}>{priorityScore}%</span>
              </div>
            </div>

            {/* Generate complaint */}
            <div className="rounded-xl border p-4" style={{ background: t.card, borderColor: t.cardBorder }}>
              <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold" style={{ color: t.text }}>✍ Complaint Text</span></div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg p-3 text-xs leading-relaxed outline-none resize-none"
                style={{ background: t.lockedBg, color: t.text, border: `1px solid ${t.inputBorder}`, fontFamily: "Inter, sans-serif" }} />
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => navigator.clipboard?.writeText(description)}
                  className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-semibold h-8 rounded-lg"
                  style={{ background: t.tagBg, color: t.text, border: `1px solid ${t.inputBorder}` }}>
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex justify-between items-center mt-6 pt-5 gap-3 flex-wrap" style={{ borderTop: `1px solid ${t.divider}` }}>
        <button onClick={onBack}
          className="inline-flex font-medium rounded-full text-sm px-5 py-3 items-center gap-2"
          style={{ background: "transparent", color: t.text, border: `1px solid ${t.inputBorder}` }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          {aiDone && (
            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: t.textSub }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Analysis complete · {issueTypeLabel} · {priorityLevel}
            </div>
          )}
          <motion.button whileHover={aiDone ? { scale: 1.02, y: -1 } : {}} whileTap={aiDone ? { scale: 0.97 } : {}}
            onClick={() => aiDone && onNext()}
            disabled={!aiDone}
            className="inline-flex font-semibold rounded-full text-sm px-6 py-3 items-center gap-2 text-white"
            style={{ background: aiDone ? "#2563EB" : (isDark ? "#1E293B" : "#CBD5E1"), boxShadow: aiDone ? "0 4px 16px rgba(37,99,235,0.30)" : "none", cursor: aiDone ? "pointer" : "not-allowed" }}>
            Next <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
