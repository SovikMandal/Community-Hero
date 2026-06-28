import { motion } from "motion/react";
import type { DashboardTheme } from "../theme";
import { ProgressBar } from "./ProgressBar";

export interface StatusCounts {
  reported: number;
  verified: number;
  assigned: number;
  completed: number;
  rejected: number;
  critical: number;
  high: number;
}

interface IssuePipelineProps {
  t: DashboardTheme;
  isDark: boolean;
  statusCounts: StatusCounts;
  total: number;
}

// Resolution-stage breakdown rendered as labelled progress bars.
export function IssuePipeline({ t, isDark, statusCounts, total }: IssuePipelineProps) {
  // Include rejected reports in the grand total so every bar shares one scale.
  const grandTotal = total + statusCounts.rejected;
  const pipelineTotal = grandTotal || 1;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 md:p-6 border transition-all"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-base" style={{ color: t.text }}>Issue Pipeline</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textSub }}>Report resolution stages</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-xl" style={{ color: "#2563EB", background: isDark?"rgba(37,99,235,0.15)":"#EFF6FF" }}>{grandTotal} total</span>
      </div>
      <div className="flex flex-col gap-4">
        <ProgressBar label="Reported"  value={statusCounts.reported}  max={pipelineTotal} color="#2563EB" delay={0.5}  t={t} />
        <ProgressBar label="Verified"  value={statusCounts.verified}  max={pipelineTotal} color="#8B5CF6" delay={0.56} t={t} />
        <ProgressBar label="Assigned"  value={statusCounts.assigned}  max={pipelineTotal} color="#F59E0B" delay={0.62} t={t} />
        <ProgressBar label="Completed" value={statusCounts.completed} max={pipelineTotal} color="#22C55E" delay={0.68} t={t} />
        <ProgressBar label="Rejected"  value={statusCounts.rejected}  max={pipelineTotal} color="#EF4444" delay={0.74} t={t} />
      </div>
    </motion.div>
  );
}
