import { motion } from "motion/react";
import { MapPin, CheckCircle2, Zap, TrendingUp, ArrowUpRight } from "lucide-react";
import type { DashboardTheme } from "../theme";
import type { DashboardStats } from "../../../lib";
import { Counter } from "./Counter";
import { Sparkline } from "./Sparkline";

interface StatCardsProps {
  t: DashboardTheme;
  isDark: boolean;
  stats: DashboardStats | null;
}

// Four headline KPI cards (totals, resolved, open, resolution rate).
export function StatCards({ t, isDark, stats }: StatCardsProps) {
  const cards = [
    { label: "Total Reports",    value: stats?.totalComplaints ?? 0,                        suffix: "",  pct: "live", icon: MapPin,       color: "#2563EB", bg: isDark?"rgba(37,99,235,0.15)":"#EFF6FF",  data: [4,6,5,8,7,9,12] },
    { label: "Resolved",         value: stats?.resolved ?? 0,                               suffix: "",  pct: "live", icon: CheckCircle2, color: "#22C55E", bg: isDark?"rgba(34,197,94,0.15)":"#F0FDF4",  data: [2,4,3,5,6,7,9]  },
    { label: "Open Issues",      value: stats ? stats.totalComplaints - stats.resolved : 0, suffix: "",  pct: "live", icon: Zap,          color: "#8B5CF6", bg: isDark?"rgba(139,92,246,0.15)":"#F5F3FF", data: [10,14,12,18,22,28,34] },
    { label: "Resolved Rate",    value: Math.round(stats?.resolvedRate ?? 0),               suffix: "%", pct: "live", icon: TrendingUp,   color: "#F59E0B", bg: isDark?"rgba(245,158,11,0.15)":"#FFFBEB", data: [60,65,70,75,80,85,91] },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      {cards.map(({ label, value, suffix, pct, icon: Icon, color, bg, data }, i) => (
        <motion.div key={label}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.07 }}
          whileHover={{ y: -4, boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.35)" : "0 12px 32px rgba(15,23,42,0.10)" }}
          className="rounded-3xl p-4 md:p-5 cursor-default transition-all border"
          style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl" style={{ color: "#16A34A", background: isDark?"rgba(22,163,74,0.15)":"#DCFCE7" }}>
              <ArrowUpRight className="w-3 h-3" />{pct}
            </span>
          </div>
          <p className="text-xs font-medium mb-0.5" style={{ color: t.textSub }}>{label}</p>
          <p className="font-bold mb-2" style={{ fontSize: "1.6rem", lineHeight: 1, color: t.text }}>
            <Counter target={value} suffix={suffix} />
          </p>
          <Sparkline data={data} color={color} />
        </motion.div>
      ))}
    </div>
  );
}
