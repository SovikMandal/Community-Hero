import { motion } from "motion/react";
import type { DashboardTheme } from "../theme";

// Labelled animated progress bar used in the "Issue Pipeline" card.
export function ProgressBar({ label, value, max, color, delay, t }: {
  label: string; value: number; max: number; color: string; delay: number;
  t: DashboardTheme;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: t.text }}>{label}</span>
        <span className="text-xs" style={{ color: t.textSub }}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: t.divider }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </motion.div>
  );
}
