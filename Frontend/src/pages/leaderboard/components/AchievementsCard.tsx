import { CheckCircle2, Lock } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardMe } from "../../../lib";

interface AchievementsCardProps {
  t: DashboardTheme;
  isDark: boolean;
  me: LeaderboardMe | null;
}

export function AchievementsCard({ t, me }: AchievementsCardProps) {
  const reports = me?.reports ?? 0;
  const verified = me?.verified ?? 0;
  const verifications = me?.verifications ?? 0;
  const resolved = me?.resolved ?? 0;

  const achievements = [
    { label: "First Report", unlocked: reports >= 1 },
    { label: "Active Reporter", unlocked: reports >= 5 },
    { label: "Community Helper", unlocked: verifications >= 5 },
    { label: "Verified Voice", unlocked: verified >= 3 },
    { label: "City Hero", unlocked: resolved >= 10 },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progress = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div
      className="rounded-3xl border p-6 grid gap-4"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      <div className="gap-1 grid">
        <div className="font-semibold text-xl" style={{ color: t.text }}>
          Achievements
        </div>
        <div className="text-sm" style={{ color: t.textSub }}>
          Unlock badges by helping the city faster and smarter.
        </div>
      </div>

      <div className="grid gap-3">
        {achievements.map((a) => (
          <div
            key={a.label}
            className="rounded-2xl flex px-4 py-3 justify-between items-center"
            style={{ background: t.tagBg }}
          >
            <div className="flex items-center gap-3">
              {a.unlocked ? (
                <CheckCircle2 className="size-4" style={{ color: "#10B981" }} />
              ) : (
                <Lock className="size-4" style={{ color: t.textMuted }} />
              )}
              <span className="font-medium text-sm" style={{ color: t.text }}>
                {a.label}
              </span>
            </div>
            <span
              className="rounded-full text-xs font-medium px-2.5 py-1"
              style={
                a.unlocked
                  ? { background: "rgba(16,185,129,0.12)", color: "#059669" }
                  : { background: t.card, color: t.textSub, border: `1px solid ${t.cardBorder}` }
              }
            >
              {a.unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>
        ))}

        <div className="space-y-2 rounded-2xl border p-4" style={{ borderColor: t.cardBorder }}>
          <div className="text-sm flex justify-between items-center">
            <span style={{ color: t.textSub }}>Achievement progress</span>
            <span className="font-medium" style={{ color: t.text }}>
              {progress}%
            </span>
          </div>
          <div className="rounded-full h-2 overflow-hidden" style={{ background: t.tagBg }}>
            <div className="rounded-full h-full" style={{ width: `${progress}%`, background: "#2563EB" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
