import { motion } from "motion/react";
import type { DashboardTheme } from "../theme";
import { timeAgo, statusLabel, type Issue } from "../../../lib";

interface ActivityTimelineProps {
  t: DashboardTheme;
  isDark: boolean;
  issues?: Issue[];
}

const STATUS_COLOR: Record<string, string> = {
  REPORTED: "#2563EB",
  VERIFIED: "#7C3AED",
  ASSIGNED: "#F59E0B",
  ENGINEER_VISITED: "#F59E0B",
  REPAIR_STARTED: "#F59E0B",
  COMPLETED: "#16A34A",
  REJECTED: "#DC2626",
};

export function ActivityTimeline({ t, isDark, issues }: ActivityTimelineProps) {
  const items = (issues ?? []).slice(0, 6).map((issue) => ({
    time: timeAgo(issue.createdAt),
    label: `${issue.title} — ${statusLabel(issue.status)}`,
    color: STATUS_COLOR[issue.status] || "#2563EB",
    done: true,
  }));

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 md:p-6 border transition-all"
      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)", borderColor: t.cardBorder, boxShadow: t.cardShadow, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <h2 className="font-bold text-base mb-5" style={{ color: t.text }}>Activity Timeline</h2>
      <div className="relative pl-6">
        <motion.div className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: t.divider }}
          initial={{ scaleY: 0, originY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: 0.65, duration: 0.6 }} />
        <div className="flex flex-col gap-5">
          {items.map(({ time, label, color }, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-start gap-4">
              <div className="absolute left-0 w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5"
                style={{ background: color, borderColor: color, boxShadow: `0 0 0 3px ${color}22` }} />
              <div>
                <p className="text-xs font-mono mb-0.5" style={{ color: t.textMuted }}>{time}</p>
                <p className="text-sm font-semibold" style={{ color: t.text }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
