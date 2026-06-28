import { Target } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** "Current stage" summary card with department / priority / severity rows. */
export function CurrentStageCard({
  t,
  isDark,
  surface,
  issue,
  currentStage,
  isRejected,
  priorityColor,
}: {
  t: DashboardTheme;
  isDark: boolean;
  surface: Surface;
  issue: Issue;
  currentStage: string;
  isRejected: boolean;
  priorityColor: string;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: "transparent", borderColor: t.inputBorder }}>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-sm" style={{ color: t.text }}>Current stage</div>
          <div className="font-semibold text-2xl mt-1" style={{ color: isRejected ? "#DC2626" : "#2563EB" }}>{currentStage}</div>
        </div>
        <div className="w-14 h-14 rounded-full flex justify-center items-center" style={{ background: isDark ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.08)", color: "#2563EB" }}>
          <Target className="w-7 h-7" />
        </div>
      </div>
      <div className="grid mt-4 gap-3">
        <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: surface.innerBg }}>
          <span className="text-sm" style={{ color: t.textSub }}>Department</span>
          <span className="font-medium text-sm" style={{ color: t.text }}>{issue.department?.name ?? "Pending"}</span>
        </div>
        <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: surface.innerBg }}>
          <span className="text-sm" style={{ color: t.textSub }}>Priority</span>
          <span className="font-medium text-sm" style={{ color: priorityColor }}>{issue.priority}</span>
        </div>
        <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: surface.innerBg }}>
          <span className="text-sm" style={{ color: t.textSub }}>Severity</span>
          <span className="font-medium text-sm" style={{ color: t.text }}>{issue.severity}</span>
        </div>
      </div>
    </div>
  );
}
