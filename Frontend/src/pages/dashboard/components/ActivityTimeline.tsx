import { motion } from "motion/react";
import type { DashboardTheme } from "../theme";
import { timeAgo, statusLabel, type MyActivityEvent, type IssueStatus } from "../../../lib";

interface ActivityTimelineProps {
  t: DashboardTheme;
  isDark: boolean;
  /** Recent lifecycle events for the user's own + supported reports. */
  events?: MyActivityEvent[];
  onViewAll?: () => void;
  /** Open the report when an activity row is clicked. */
  onSelect?: (issueId: string) => void;
}

const STATUS_COLOR: Record<IssueStatus, string> = {
  REPORTED: "#2563EB",
  ACCEPTED: "#0EA5E9",
  VERIFIED: "#7C3AED",
  ASSIGNED: "#F59E0B",
  ENGINEER_VISITED: "#0891B2",
  REPAIR_STARTED: "#CA8A04",
  COMPLETED: "#16A34A",
  REJECTED: "#DC2626",
};

// Friendly action label per lifecycle stage.
function activityLabel(e: MyActivityEvent): string {
  switch (e.status) {
    case "REPORTED":
      return "Report submitted";
    case "ACCEPTED":
      return "Report accepted";
    case "VERIFIED":
      return "Report verified";
    case "ASSIGNED":
      return e.department ? `Routed to ${e.department}` : "Routed to department";
    case "ENGINEER_VISITED":
      return "Field inspector assigned";
    case "REPAIR_STARTED":
      return "Repair started";
    case "COMPLETED":
      return "Report resolved";
    case "REJECTED":
      return "Report rejected";
    default:
      return statusLabel(e.status);
  }
}

export function ActivityTimeline({ t, isDark, events, onViewAll, onSelect }: ActivityTimelineProps) {
  const items = (events ?? []).slice(0, 6);

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 md:p-6 border transition-all"
      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)", borderColor: t.cardBorder, boxShadow: t.cardShadow, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-base" style={{ color: t.text }}>Activity Timeline</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "#2563EB" }}
          >
            View all →
          </button>
        )}
      </div>
      <div className="relative pl-6">
        <motion.div className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: t.divider }}
          initial={{ scaleY: 0, originY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.65, duration: 0.6 }} />
        <div className="flex flex-col gap-5">
          {items.map((e, i) => {
            const color = STATUS_COLOR[e.status] || "#2563EB";
            return (
              <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-start gap-4">
                <div className="absolute left-0 w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5"
                  style={{ background: color, borderColor: color, boxShadow: `0 0 0 3px ${color}22` }} />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                  onClick={() => e.issueId && onSelect?.(e.issueId)}
                  className="min-w-0 text-left cursor-pointer rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-colors"
                >
                  <p className="text-xs font-mono mb-0.5" style={{ color: t.textMuted }}>{timeAgo(e.createdAt)}</p>
                  <p className="text-sm font-semibold" style={{ color: t.text }}>{activityLabel(e)}</p>
                  <p className="truncate text-xs" style={{ color: t.textSub }}>
                    {e.issueTitle}
                    {e.reportType === "merged" ? " · supported" : ""}
                  </p>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
