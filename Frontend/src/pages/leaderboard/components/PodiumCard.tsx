import { User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardEntry } from "../../../lib";

export interface PodiumTier {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Solid avatar background. */
  avatar: string;
  /** Accent colour for the icon tile + rank chip. */
  accent: string;
  /** Translucent accent background (light theme). */
  accentBgLight: string;
  /** Translucent accent background (dark theme). */
  accentBgDark: string;
  rankLabel: string;
}

interface PodiumCardProps {
  t: DashboardTheme;
  isDark: boolean;
  tier: PodiumTier;
  entry?: LeaderboardEntry;
}

export function PodiumCard({ t, isDark, tier, entry }: PodiumCardProps) {
  const Icon = tier.icon;
  const accentBg = isDark ? tier.accentBgDark : tier.accentBgLight;

  return (
    <div
      className="rounded-3xl border p-6 grid gap-4 content-start"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      <div className="flex items-center gap-3">
        <div
          className="size-10 rounded-2xl flex justify-center items-center"
          style={{ background: accentBg, color: tier.accent }}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <div className="font-semibold text-lg" style={{ color: t.text }}>
            {tier.title}
          </div>
          <div className="text-sm" style={{ color: t.textSub }}>
            {tier.subtitle}
          </div>
        </div>
      </div>

      {entry ? (
        <>
          <div className="rounded-2xl flex p-4 items-center gap-4" style={{ background: t.tagBg }}>
            <div
              className="size-14 rounded-full flex justify-center items-center shrink-0 overflow-hidden"
              style={{ background: tier.avatar, color: "#FFFFFF" }}
            >
              {entry.avatar ? <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" /> : <User className="size-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold truncate" style={{ color: t.text }}>
                  {entry.name}
                </div>
                <span
                  className="rounded-full text-xs font-semibold px-2.5 py-0.5 shrink-0"
                  style={{ background: accentBg, color: tier.accent }}
                >
                  {tier.rankLabel}
                </span>
              </div>
              <div className="text-sm" style={{ color: t.textSub }}>
                {entry.points.toLocaleString()} points · Level {entry.level}
              </div>
            </div>
          </div>
          <div className="grid rounded-2xl border p-4 gap-2" style={{ borderColor: t.cardBorder }}>
            <Row t={t} label="Reports verified" value={entry.verified} />
            <Row t={t} label="Issues resolved" value={entry.resolved} />
            <Row t={t} label="Impact score" value={entry.impactScore} accent />
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-6 text-center text-sm" style={{ background: t.tagBg, color: t.textSub }}>
          No contributor yet for this spot.
        </div>
      )}
    </div>
  );
}

function Row({
  t,
  label,
  value,
  accent,
}: {
  t: DashboardTheme;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="text-sm flex justify-between items-center">
      <span style={{ color: t.textSub }}>{label}</span>
      <span className="font-medium" style={{ color: accent ? "#2563EB" : t.text }}>
        {value}
      </span>
    </div>
  );
}
