import { useCallback, useEffect, useMemo, useState } from "react";
import { tk } from "../dashboard/theme";
import { community, type CommunityReport, type IssueCategory } from "../../lib";
import { CommunityHeader, type SortOption } from "./components/CommunityHeader";
import { CommunityReportCard } from "./components/CommunityReportCard";
import { CommunitySkeleton } from "../PageSkeletons";

interface CommunityPageProps {
  isDark: boolean;
}

export function CommunityPage({ isDark }: CommunityPageProps) {
  const t = tk(isDark);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<IssueCategory | "ALL">("ALL");
  const [sort, setSort] = useState<SortOption>("newest");
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const handle = setTimeout(() => {
      setLoading(true);
      setError(null);
      community
        .reports({ q: search.trim() || undefined, limit: 30 })
        .then((res) => { if (active) setReports(res.items); })
        .catch(() => { if (active) setError("Could not load community reports. Is the backend running?"); })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [search]);

  const updateReport = useCallback((updated: CommunityReport) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const filtered = useMemo(() => {
    let list = reports;
    if (filterCategory !== "ALL") list = list.filter((r) => r.category === filterCategory);
    switch (sort) {
      case "oldest": list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "newest": list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "most_verified": list = [...list].sort((a, b) => b.verifiedCount - a.verifiedCount); break;
      case "highest_confidence": list = [...list].sort((a, b) => b.aiConfidence - a.aiConfidence); break;
    }
    return list;
  }, [reports, filterCategory, sort]);

  return (
    <div className="w-full min-h-full transition-colors duration-300" style={{ color: t.text, fontFamily: "Inter, sans-serif" }}>
      <main className="px-4 md:px-8 py-6 max-w-[1100px] mx-auto flex flex-col gap-6">
        <CommunityHeader
          t={t} isDark={isDark}
          search={search} setSearch={setSearch}
          filterCategory={filterCategory} setFilterCategory={setFilterCategory}
          sort={sort} setSort={setSort}
        />

        {loading ? (
          <CommunitySkeleton />
        ) : error ? (
          <div className="mt-10 text-center text-sm" style={{ color: "#EF4444" }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 text-center text-sm" style={{ color: t.textSub }}>
            {search.trim() || filterCategory !== "ALL" ? "No reports match your filters." : "No active reports to verify right now."}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((report) => (
              <CommunityReportCard key={report.id} t={t} isDark={isDark} report={report} onChange={updateReport} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
