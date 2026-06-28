import { CheckCircle2, RefreshCw, Send } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Surface } from "./reportDetail";

/** Footer with "Refresh status" and "Advance status" controls. */
export function ReportFooter({
  t,
  surface,
  busy,
  canAdvance,
  onRefresh,
  onAdvance,
}: {
  t: DashboardTheme;
  surface: Surface;
  busy: boolean;
  canAdvance: boolean;
  onRefresh: () => void;
  onAdvance: () => void;
}) {
  return (
    <div className="rounded-3xl border flex flex-wrap p-4 justify-between items-center gap-3" style={{ background: surface.cardBg, borderColor: t.cardBorder, ...surface.blur }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: t.textSub }}>
        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tracking active
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={busy}
          className="inline-flex font-semibold rounded-full text-sm px-5 py-2.5 items-center gap-2 border disabled:opacity-60"
          style={{ borderColor: t.inputBorder, color: t.text }}
        >
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Refresh Status
        </button>
        <button
          onClick={onAdvance}
          disabled={!canAdvance}
          className="inline-flex font-semibold rounded-full text-sm px-5 py-2.5 items-center gap-2 text-white disabled:opacity-60"
          style={{ background: "#2563EB" }}
        >
          <Send className="w-4 h-4" /> Advance Status
        </button>
      </div>
    </div>
  );
}
