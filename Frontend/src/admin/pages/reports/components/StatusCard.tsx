import { CheckCircle2, X } from "lucide-react";
import { timeAgo } from "../../../../lib";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue, IssueContributor } from "../../../../lib";
import type { DerivedReport, Surface } from "./reportDetail";
import { ContributorsTable } from "./ContributorsTable";
import { ProgressTimeline } from "./ProgressTimeline";
import { CurrentStageCard } from "./CurrentStageCard";

/** The main "Live status" card: title, accept/reject, contributors, timeline. */
export function StatusCard({
  t,
  isDark,
  surface,
  issue,
  derived,
  isDepartment,
  busy,
  contributors,
  onAccept,
  onReject,
}: {
  t: DashboardTheme;
  isDark: boolean;
  surface: Surface;
  issue: Issue;
  derived: DerivedReport;
  isDepartment: boolean;
  busy: boolean;
  contributors: IssueContributor[];
  onAccept: () => void;
  onReject: () => void;
}) {
  const { loc, issueStatusLabel, statusColor, isRejected, locked, routed, deptAccepted, currentIndex, stageOrder } = derived;

  const acceptDisabled = isDepartment
    ? (busy || locked || !routed || deptAccepted)
    : (busy || locked || isRejected || currentIndex >= stageOrder.indexOf("ACCEPTED"));

  return (
    <div className="rounded-3xl border p-4 md:p-6" style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div>
          <div className="font-medium text-sm text-blue-500">Live status</div>
          <h2 className="font-semibold text-xl md:text-2xl tracking-tight mt-1" style={{ color: t.text }}>{issue.title}</h2>
          <p className="text-sm mt-2 mb-3" style={{ color: t.textSub }}>{loc} · Submitted {timeAgo(issue.createdAt)}</p>
        </div>
        <span className="rounded-full text-xs font-semibold px-3 py-1.5" style={{ background: `${statusColor}15`, color: statusColor }}>{issueStatusLabel}</span>
      </div>

      {/* Accept / Reject actions */}
      <div className="grid grid-cols-2 gap-3 mx-5">
        <button
          onClick={onAccept}
          disabled={acceptDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: "#16A34A" }}
        >
          <CheckCircle2 className="w-4 h-4" /> Accept report
        </button>
        <button
          onClick={onReject}
          disabled={busy || locked || isRejected}
          className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}
        >
          <X className="w-4 h-4" /> Reject report
        </button>
      </div>

      {/* User details — report creator + everyone who merged a duplicate */}
      <ContributorsTable t={t} surface={surface} contributors={contributors} />

      <div className="grid mt-6 gap-4">
        <ProgressTimeline t={t} surface={surface} steps={derived.timelineSteps} updatedAt={issue.updatedAt} />
        <CurrentStageCard
          t={t}
          isDark={isDark}
          surface={surface}
          issue={issue}
          currentStage={derived.currentStage}
          isRejected={isRejected}
          priorityColor={derived.priorityColor}
        />
      </div>
    </div>
  );
}
