import { motion } from "motion/react";
import { Target } from "lucide-react";
import type { LeaderboardMe } from "../../../lib";

interface TodaysMissionProps {
  isDark?: boolean;
  me?: LeaderboardMe | null;
}

const BADGE_ORDER = ["Newcomer", "Contributor", "Supporter", "Rising Star", "Community Hero", "City Helper", "City Champion"];

function nextBadge(current: string) {
  const idx = BADGE_ORDER.indexOf(current);
  return idx >= 0 && idx < BADGE_ORDER.length - 1 ? BADGE_ORDER[idx + 1] : BADGE_ORDER[BADGE_ORDER.length - 1];
}

export function TodaysMission({ isDark = false, me }: TodaysMissionProps) {
  const verifications = me?.verifications ?? 0;
  const pts = me?.points ?? 0;
  const ptsToNext = me?.pointsToNextLevel ?? 500;
  const badge = me?.badge ?? "Newcomer";
  const goal = verifications < 2 ? 2 : verifications < 5 ? 5 : 10;
  const task = `Verify ${goal - verifications > 0 ? goal - verifications : goal} more reports in your area`;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 flex items-center gap-4 cursor-pointer transition-all"
      style={{
        background: isDark ? "transparent" : "linear-gradient(135deg,#1E40AF 0%,#2563EB 60%,#3B82F6 100%)",
        border: isDark ? "1px solid rgba(255,255,255,0.18)" : "none",
      }}>
      <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
        <Target className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Today's Mission</p>
        <p className="text-white font-bold text-sm md:text-base truncate">{task}</p>
        <p className="text-blue-200 text-xs mt-0.5">Earn <span className="text-white font-bold">+{ptsToNext} pts</span> · unlock {nextBadge(badge)} badge</p>
      </div>
      <div className="flex-shrink-0 text-right hidden sm:block">
        <div className="text-white font-bold text-xl">{verifications}/{goal}</div>
        <p className="text-blue-200 text-xs">{pts} pts total</p>
      </div>
    </motion.div>
  );
}
