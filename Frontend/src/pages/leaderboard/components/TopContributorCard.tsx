import { Crown } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardEntry } from "../../../lib";
import { PodiumCard } from "./PodiumCard";

interface Props {
  t: DashboardTheme;
  isDark: boolean;
  entry?: LeaderboardEntry;
}

export function TopContributorCard({ t, isDark, entry }: Props) {
  return (
    <PodiumCard
      t={t}
      isDark={isDark}
      entry={entry}
      tier={{
        title: "Top Contributor",
        subtitle: "Gold tier civic champion",
        icon: Crown,
        avatar: "#F59E0B",
        accent: "#B45309",
        accentBgLight: "rgba(245,158,11,0.10)",
        accentBgDark: "rgba(245,158,11,0.18)",
        rankLabel: "#1",
      }}
    />
  );
}
