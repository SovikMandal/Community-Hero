import { Check, Clock } from "lucide-react";
import { timeAgo } from "../../../../lib";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Surface, TimelineStep } from "./reportDetail";

/** Vertical lifecycle timeline with done / in-progress / pending steps. */
export function ProgressTimeline({
  t,
  surface,
  steps,
  updatedAt,
}: {
  t: DashboardTheme;
  surface: Surface;
  steps: TimelineStep[];
  updatedAt: string;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: surface.timelineBg, borderColor: t.inputBorder }}>
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm" style={{ color: t.text }}>Progress timeline</div>
        <div className="text-xs" style={{ color: t.textSub }}>Updated {timeAgo(updatedAt)}</div>
      </div>
      <div className="space-y-4 mt-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex justify-center items-center"
              style={{
                background: step.state === "done"
                  ? (step.label === "Rejected" ? "#DC2626" : "#2563EB")
                  : step.state === "current" ? "#D97706" : t.tagBg,
                color: step.state === "pending" ? t.textMuted : "white",
              }}>
              {step.state === "done"
                ? <Check className="w-4 h-4" />
                : step.state === "current"
                  ? <Clock className="w-4 h-4" />
                  : <div className="w-2 h-2 rounded-full" style={{ background: t.textMuted }} />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: step.state !== "pending" ? t.text : t.textMuted }}>{step.label}</div>
                  {step.label === "Rejected" ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}>Rejected</span>
                  ) : step.state === "done" ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                      <Check className="w-3 h-3" /> Done
                    </span>
                  ) : step.state === "current" ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: "rgba(217,119,6,0.12)", color: "#D97706" }}>
                      <Clock className="w-3 h-3" /> In progress
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: t.tagBg, color: t.textMuted }}>Pending</span>
                  )}
                </div>
                {step.timestamp && (
                  <div className="flex shrink-0 items-center gap-1 text-xs" style={{ color: t.textSub }}>
                    <Clock className="w-3 h-3" />
                    {timeAgo(step.timestamp)}
                  </div>
                )}
              </div>
              <div className="text-xs" style={{ color: t.textSub }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
