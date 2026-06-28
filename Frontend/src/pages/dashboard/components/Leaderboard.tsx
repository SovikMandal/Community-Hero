import { motion } from "motion/react";
import { Award, Trophy, ArrowUpRight } from "lucide-react";
import type { DashboardTheme } from "../theme";
import type { LeaderboardResult } from "../../../lib";

interface LeaderboardProps {
  t: DashboardTheme;
  isDark: boolean;
  data?: LeaderboardResult | null;
}

const rankEmojis = ["🥇", "🥈", "🥉"];

export function Leaderboard({ t, isDark, data }: LeaderboardProps) {
  const top3 = (data?.entries ?? []).filter(e => e.role !== "ADMIN").slice(0, 3);
  const me = data?.me;

  if (top3.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border p-5 transition-all"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: t.text }}>Leaderboard</h3>
      </div>
      <div className="flex flex-col gap-3 mb-4">
        {top3.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.62 + i * 0.08 }}
            className="flex items-center gap-3 p-2.5 rounded-2xl transition-all"
            style={{ background: entry.isMe ? (isDark ? "rgba(37,99,235,0.15)" : "#EFF6FF") : t.tagBg, border: entry.isMe ? `1px solid ${isDark ? "rgba(37,99,235,0.25)" : "#DBEAFE"}` : "1px solid transparent" }}>
            <span className="text-lg flex-shrink-0">{rankEmojis[i] ?? `#${i + 1}`}</span>
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold border-2"
              style={{ background: entry.avatar ? undefined : "#2563EB", borderColor: entry.isMe ? "#2563EB" : "transparent" }}>
              {entry.avatar ? <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" /> : entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: t.text }}>
                {entry.name}{entry.isMe && <span className="text-blue-500"> (you)</span>}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Award className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} />
                <p className="text-xs font-medium truncate" style={{ color: "#F59E0B" }}>{entry.badge}</p>
              </div>
            </div>
            <span className="text-xs font-bold flex-shrink-0" style={{ color: t.textSub }}>{entry.points.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {me && (
        <>
          <div className="rounded-2xl p-3.5 border mb-3" style={{ background: isDark ? "rgba(245,158,11,0.10)" : "#FFFBEB", borderColor: isDark ? "rgba(245,158,11,0.20)" : "#FDE68A" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: t.text }}>Level {me.level + 1}</p>
                  <p className="text-xs" style={{ color: t.textSub }}>Next level</p>
                </div>
              </div>
              <p className="text-amber-500 text-xs font-bold">{me.pointsToNextLevel} pts away</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(245,158,11,0.15)" : "#FDE68A" }}>
              <motion.div className="h-full rounded-full bg-amber-400"
                initial={{ width: 0 }} animate={{ width: `${me.levelProgress}%` }}
                transition={{ delay: 0.9, duration: 0.9 }} />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
            <Trophy className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <div>
              <p className="text-white text-xs font-bold">You&apos;re ranked #{me.rank}</p>
              <p className="text-blue-200 text-xs">{me.points.toLocaleString()} points · {me.badge}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-blue-200 ml-auto flex-shrink-0" />
          </div>
        </>
      )}
    </motion.div>
  );
}
