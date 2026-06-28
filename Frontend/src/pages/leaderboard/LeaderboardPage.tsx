import { useEffect, useMemo, useState } from "react";
import { dashboard, type LeaderboardResult } from "../../lib";
import { tk } from "../dashboard/theme";
import { LeaderboardHeader } from "./components/LeaderboardHeader";
import { YourRankCard } from "./components/YourRankCard";
import { TopContributorCard } from "./components/TopContributorCard";
import { RunnerUpCard } from "./components/RunnerUpCard";
import { ThirdPlaceCard } from "./components/ThirdPlaceCard";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { AchievementsCard } from "./components/AchievementsCard";
import { LeaderboardSkeleton } from "../PageSkeletons";

interface LeaderboardPageProps {
  isDark: boolean;
}

export function LeaderboardPage({ isDark }: LeaderboardPageProps) {
  const t = tk(isDark);

  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    dashboard
      .leaderboard()
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setError("Could not load the leaderboard. Is the backend running?");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const entries = (data?.entries ?? []).filter(e => e.role !== "ADMIN");

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <div
      className="w-full min-h-full transition-colors duration-300"
      style={{ color: t.text, fontFamily: "Inter, sans-serif" }}
    >
      <main className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
        <LeaderboardHeader
          t={t}
          isDark={isDark}
          search={search}
          setSearch={setSearch}
          totalCitizens={data?.totalCitizens ?? 0}
        />

        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="mt-10 text-center text-sm" style={{ color: "#EF4444" }}>
            {error}
          </div>
        ) : (
          <div className="grid mt-8 gap-6">
            <YourRankCard t={t} isDark={isDark} me={data?.me ?? null} />

            <div className="grid gap-6 md:grid-cols-3">
              <TopContributorCard t={t} isDark={isDark} entry={entries[0]} />
              <RunnerUpCard t={t} isDark={isDark} entry={entries[1]} />
              <ThirdPlaceCard t={t} isDark={isDark} entry={entries[2]} />
            </div>

            <div className="grid gap-6">
              <LeaderboardTable
                t={t}
                isDark={isDark}
                entries={filteredEntries}
                hasSearch={search.trim().length > 0}
              />
            </div>

            <div className="grid gap-6">
              <AchievementsCard t={t} isDark={isDark} me={data?.me ?? null} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
