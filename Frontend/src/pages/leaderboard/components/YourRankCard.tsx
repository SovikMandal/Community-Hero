import { Award } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardMe } from "../../../lib";

interface YourRankCardProps {
  t: DashboardTheme;
  isDark: boolean;
  me: LeaderboardMe | null;
}

export function YourRankCard({ t, isDark, me }: YourRankCardProps) {
  if (!me) {
    return (
      <div
        className="rounded-3xl border p-6"
        style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
      >
        <div className="font-semibold text-xl" style={{ color: t.text }}>
          Your Rank
        </div>
        <div className="text-sm mt-2" style={{ color: t.textSub }}>
          Sign in to track your contribution progress and climb the civic leaderboard.
        </div>
      </div>
    );
  }

  const cityRankLabel =
    me.rank <= 15 ? `Top ${me.rank}` : me.rank <= 50 ? "Top 50" : `#${me.rank}`;

  return (
    <div
      className="rounded-3xl border p-6 grid gap-4"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold text-2xl" style={{ color: t.text }}>
            Your Rank
          </div>
          <div className="text-sm mt-1" style={{ color: t.textSub }}>
            Track your contribution progress and climb the civic leaderboard.
          </div>
        </div>
        <span
          className="rounded-full text-sm font-semibold px-3 py-1"
          style={{ background: isDark ? "rgba(37,99,235,0.18)" : "#EFF6FF", color: "#2563EB" }}
        >
          Rank #{me.rank}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div
          className="size-16 rounded-2xl flex justify-center items-center shrink-0"
          style={{ background: "#2563EB", color: "#EFF6FF" }}
        >
          <Award className="size-7" />
        </div>
        <div className="space-y-2 flex-1 w-full">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-xl" style={{ color: t.text }}>
              {me.name}
            </div>
            <span
              className="rounded-full text-xs font-medium px-2.5 py-0.5"
              style={{ background: t.tagBg, color: t.tagText }}
            >
              Level {me.level}
            </span>
          </div>
          <div className="text-sm" style={{ color: t.textSub }}>
            {me.points.toLocaleString()} points · {me.reports} reports submitted ·{" "}
            {me.verified} verified · {me.resolved} resolved
          </div>
          <div className="space-y-2">
            <div className="text-xs flex justify-between items-center" style={{ color: t.textSub }}>
              <span>Progress to Level {me.level + 1}</span>
              <span>{me.levelProgress}%</span>
            </div>
            <div className="rounded-full w-full h-2 overflow-hidden" style={{ background: t.tagBg }}>
              <div
                className="rounded-full h-full"
                style={{ width: `${me.levelProgress}%`, background: "#2563EB" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat t={t} label="Points to next level" value={me.pointsToNextLevel.toLocaleString()} />
        <Stat t={t} label="City rank" value={cityRankLabel} />
        <Stat t={t} label="Impact score" value={`${me.impactScore}%`} accent />
      </div>
    </div>
  );
}

function Stat({
  t,
  label,
  value,
  accent,
}: {
  t: DashboardTheme;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl flex px-4 py-3 justify-between items-center"
      style={{ background: t.tagBg }}
    >
      <span className="text-sm" style={{ color: t.textSub }}>
        {label}
      </span>
      <span className="font-semibold text-sm" style={{ color: accent ? "#2563EB" : t.text }}>
        {value}
      </span>
    </div>
  );
}
