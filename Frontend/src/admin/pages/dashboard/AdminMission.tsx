import { motion } from "motion/react";
import { Target, ArrowRight, CheckCircle2 } from "lucide-react";
import type { AdminOverview } from "../../../lib";

interface AdminMissionProps {
  isDark?: boolean;
  data?: AdminOverview | null;
  onAction?: () => void;
}

/**
 * The admin counterpart to the citizen dashboard's "Today's Mission" card.
 *
 * Instead of personal gamification goals, it surfaces the single most pressing
 * operational action for the admin — derived from the live report pipeline —
 * and a clear call-to-action that jumps to the relevant work queue.
 */
export function AdminMission({ isDark = false, data, onAction }: AdminMissionProps) {
  const byStatus = data?.issues.byStatus ?? {};
  const total = data?.issues.total ?? 0;
  const resolvedRate = data?.issues.resolvedRate ?? 0;

  const newReports = byStatus.REPORTED ?? 0;
  const verifiedAwaiting = byStatus.VERIFIED ?? 0;
  const inProgress =
    (byStatus.ASSIGNED ?? 0) +
    (byStatus.ENGINEER_VISITED ?? 0) +
    (byStatus.REPAIR_STARTED ?? 0);

  // Pick the highest-priority pending action. Triaging new reports comes first,
  // then routing verified reports, then following up on active repairs.
  let task: string;
  let count: number;
  let cta: string;
  let allClear = false;

  if (newReports > 0) {
    count = newReports;
    task = `Triage ${newReports} new report${newReports > 1 ? "s" : ""} awaiting review`;
    cta = "Review reports";
  } else if (verifiedAwaiting > 0) {
    count = verifiedAwaiting;
    task = `Route ${verifiedAwaiting} verified report${verifiedAwaiting > 1 ? "s" : ""} to departments`;
    cta = "Assign departments";
  } else if (inProgress > 0) {
    count = inProgress;
    task = `Follow up on ${inProgress} in-progress repair${inProgress > 1 ? "s" : ""}`;
    cta = "Track progress";
  } else {
    count = 0;
    task = "All caught up — no reports pending action";
    cta = "View all reports";
    allClear = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="overflow-hidden rounded-2xl p-5"
      style={{
        background: isDark
          ? "transparent"
          : "linear-gradient(135deg,#1E40AF 0%,#2563EB 60%,#3B82F6 100%)",
        border: isDark ? "1px solid rgba(255,255,255,0.18)" : "none",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Icon */}
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
          {allClear ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <Target className="h-5 w-5 text-white" />
          )}
        </div>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
            Admin Mission
          </p>
          <p className="text-sm font-bold text-white md:text-base">{task}</p>
          <p className="mt-0.5 text-xs text-blue-200">
            {resolvedRate}% resolved · <span className="font-bold text-white">{total}</span> total reports
          </p>
        </div>

        {/* Count */}
        {!allClear && (
          <div className="hidden flex-shrink-0 text-right sm:block">
            <div className="text-xl font-bold text-white">{count}</div>
            <p className="text-xs text-blue-200">pending</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onAction}
          className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
