import { Medal } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardEntry } from "../../../lib";
import { PodiumCard } from "./PodiumCard";

interface Props {
  t: DashboardTheme;
  isDark: boolean;
  entry?: LeaderboardEntry;
}

export function RunnerUpCard({ t, isDark, entry }: Props) {
  return (
    <PodiumCard
      t={t}
      isDark={isDark}
      entry={entry}
      tier={{
        title: "Runner Up",
        subtitle: "Silver tier community leader",
        icon: Medal,
        avatar: "#94A3B8",
        accent: "#475569",
        accentBgLight: "rgba(100,116,139,0.10)",
        accentBgDark: "rgba(148,163,184,0.18)",
        rankLabel: "#2",
      }}
    />
  );
}
