import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import type { DashboardTheme } from "../theme";
import { timeAgo, statusLabel, categoryLabel, type Issue } from "../../../lib";

interface CommunityFeedProps {
  t: DashboardTheme;
  isDark: boolean;
  issues?: Issue[];
}

const STATUS_COLOR: Record<string, string> = {
  REPORTED: "#EF4444",
  VERIFIED: "#8B5CF6",
  ASSIGNED: "#2563EB",
  COMPLETED: "#22C55E",
};

export function CommunityFeed({ t, isDark, issues }: CommunityFeedProps) {
  const items = (issues ?? []).slice(0, 5).map((issue) => ({
    user: issue.reporter?.name ?? "Anonymous",
    avatar: issue.reporter?.avatar ?? null,
    action: `reported ${categoryLabel(issue.category).toLowerCase()}`,
    location: issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`,
    time: timeAgo(issue.createdAt),
    type: statusLabel(issue.status).toLowerCase(),
    color: STATUS_COLOR[issue.status] || "#2563EB",
  }));

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border overflow-hidden transition-all"
      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)", borderColor: t.cardBorder, boxShadow: t.cardShadow, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-between px-5 md:px-6 py-5" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <h2 className="font-bold text-base" style={{ color: t.text }}>Community Feed</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textSub }}>Live activity from your city</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-500 text-xs font-semibold">Live</span>
        </div>
      </div>
      {items.map(({ user, avatar, action, location, time, type, color }, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68 + i * 0.07 }}
          className="flex items-start gap-3 md:gap-4 px-5 md:px-6 py-4 transition-colors"
          style={{ borderBottom: i < items.length - 1 ? `1px solid ${t.divider}` : "none" }}>
          <div className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5 overflow-hidden flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
            {avatar ? <img src={avatar} alt={user} className="w-full h-full object-cover" /> : user.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <strong className="font-bold" style={{ color: t.text }}>{user}</strong>
              {" "}<span style={{ color: t.textSub }}>{action}</span>
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" style={{ color: t.textMuted }} />
              <p className="text-xs truncate" style={{ color: t.textSub }}>{location}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <p className="text-xs" style={{ color: t.textMuted }}>{time}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg capitalize"
              style={{ color, background: `${color}18` }}>
              {type}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
