import { useState } from "react";
import { Search, RefreshCw, CalendarDays, Trophy } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";

interface LeaderboardHeaderProps {
  t: DashboardTheme;
  isDark: boolean;
  search: string;
  setSearch: (v: string) => void;
  totalCitizens: number;
}

type Period = "Weekly" | "Monthly" | "All Time";

export function LeaderboardHeader({ t, search, setSearch, totalCitizens }: LeaderboardHeaderProps) {
  const [period, setPeriod] = useState<Period>("All Time");

  const periods: { key: Period; icon: typeof Trophy }[] = [
    { key: "Weekly", icon: RefreshCw },
    { key: "Monthly", icon: CalendarDays },
    { key: "All Time", icon: Trophy },
  ];

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
      <div>
        <div className="text-sm" style={{ color: t.textSub }}>
          Recognizing {totalCitizens.toLocaleString()} citizens making the city better
        </div>
        <h1 className="font-semibold text-3xl md:text-4xl tracking-tight mt-1" style={{ color: t.text }}>
          Leaderboard
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="rounded-full flex px-4 py-2 items-center gap-2 border"
          style={{ background: t.card, borderColor: t.inputBorder }}
        >
          <Search className="size-4" style={{ color: t.textMuted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search citizens"
            className="bg-transparent outline-none text-sm w-36"
            style={{ color: t.text }}
          />
        </div>
        {periods.map(({ key, icon: Icon }) => {
          const active = period === key;
          return (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 border transition-colors"
              style={{
                background: active ? "#2563EB" : t.card,
                color: active ? "#FFFFFF" : t.textSub,
                borderColor: active ? "#2563EB" : t.inputBorder,
              }}
            >
              <Icon className="size-4" />
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
