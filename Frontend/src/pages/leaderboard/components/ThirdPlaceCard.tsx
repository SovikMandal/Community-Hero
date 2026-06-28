import { Ribbon } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardEntry } from "../../../lib";
import { PodiumCard } from "./PodiumCard";

interface Props {
  t: DashboardTheme;
  isDark: boolean;
  entry?: LeaderboardEntry;
}

export function ThirdPlaceCard({ t, isDark, entry }: Props) {
  return (
    <PodiumCard
      t={t}
      isDark={isDark}
      entry={entry}
      tier={{
        title: "Third Place",
        subtitle: "Bronze tier civic supporter",
        icon: Ribbon,
        avatar: "#F97316",
        accent: "#C2410C",
        accentBgLight: "rgba(249,115,22,0.10)",
        accentBgDark: "rgba(249,115,22,0.18)",
        rankLabel: "#3",
      }}
    />
  );
}
