import { motion } from "motion/react";
import type { DashboardTheme } from "../theme";
import type { DashboardStats } from "../../../lib";

interface GreetingProps {
  t: DashboardTheme;
  greeting: string;
  firstName: string;
  stats: DashboardStats | null;
  dataError: string | null;
}

// Date line, personalised greeting and a one-line city status summary.
export function Greeting({ t, greeting, firstName, stats, dataError }: GreetingProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <p className="text-sm font-medium mb-1" style={{ color: t.textSub }}>
        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <h1 className="font-bold mb-1" style={{ fontSize: "clamp(1.5rem,3vw,1.9rem)", lineHeight: 1.2, color: t.text }}>
        {greeting}, <span style={{ color: "#2563EB" }}>{firstName}</span> 👋
      </h1>
      <p className="text-sm" style={{ color: t.textSub }}>
        {stats
          ? <>There are <strong style={{ color: t.text }}>{Math.max(stats.totalComplaints - stats.resolved - stats.rejected, 0)} open issues</strong> and <strong style={{ color: t.text }}>{stats.resolved} resolved</strong> citywide.</>
          : dataError
          ? <span style={{ color: "#EF4444" }}>{dataError}</span>
          : "Loading the latest community data…"}
      </p>
    </motion.div>
  );
}
