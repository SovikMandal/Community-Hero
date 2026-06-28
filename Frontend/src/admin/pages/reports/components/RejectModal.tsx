import { ArrowLeft, Loader2, Send, Sparkles, X } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Surface } from "./reportDetail";

/** Reject-with-reason modal (with an optional AI-drafted reason). */
export function RejectModal({
  t,
  isDark,
  surface,
  reason,
  busy,
  generating,
  onReasonChange,
  onGenerate,
  onClose,
  onSubmit,
}: {
  t: DashboardTheme;
  isDark: boolean;
  surface: Surface;
  reason: string;
  busy: boolean;
  generating: boolean;
  onReasonChange: (value: string) => void;
  onGenerate: () => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={() => !generating && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border p-5 md:p-6"
        style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}>
            <X className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-lg" style={{ color: t.text }}>Reject report</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: t.textSub }}>
          Tell the reporter why this report is being rejected. This reason is shown on their tracking page.
        </p>

        <label className="text-xs font-medium" style={{ color: t.textSub }}>Reason for rejection</label>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={5}
          autoFocus
          placeholder="e.g. This report duplicates an existing case, or the location falls outside our service area…"
          className="mt-1.5 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none"
          style={{ background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" }}
        />

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ borderColor: t.inputBorder, color: t.text }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onGenerate}
              disabled={generating || busy}
              className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ borderColor: t.inputBorder, color: "#2563EB", background: isDark ? "rgba(37,99,235,0.10)" : "rgba(37,99,235,0.06)" }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate with AI"}
            </button>
            <button
              onClick={onSubmit}
              disabled={busy || generating || !reason.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#DC2626" }}
            >
              <Send className="w-4 h-4" /> Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
