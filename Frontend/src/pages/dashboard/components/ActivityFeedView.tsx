import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import type { DashboardTheme } from "../theme";
import {
  issues as issuesApi,
  statusLabel,
  timeAgo,
  type MyActivityEvent,
  type IssueStatus,
} from "../../../lib";

interface ActivityFeedViewProps {
  t: DashboardTheme;
  isDark: boolean;
  onBack: () => void;
  onSelect: (issueId: string) => void;
}

const STATUS_COLOR: Record<IssueStatus, string> = {
  REPORTED: "#2563EB",
  VERIFIED: "#7C3AED",
  ASSIGNED: "#F59E0B",
  ENGINEER_VISITED: "#0891B2",
  REPAIR_STARTED: "#CA8A04",
  COMPLETED: "#16A34A",
  REJECTED: "#DC2626",
};

// Friendly action label per lifecycle stage.
function activityLabel(e: MyActivityEvent): string {
  switch (e.status) {
    case "REPORTED":
      return "Report submitted";
    case "VERIFIED":
      return "Report verified";
    case "ASSIGNED":
      return e.department ? `Routed to ${e.department}` : "Routed to department";
    case "ENGINEER_VISITED":
      return "Field inspector assigned";
    case "REPAIR_STARTED":
      return "Repair started";
    case "COMPLETED":
      return "Report resolved";
    case "REJECTED":
      return "Report rejected";
    default:
      return statusLabel(e.status);
  }
}

const PAGE_SIZE = 20;

export function ActivityFeedView({ t, isDark, onBack, onSelect }: ActivityFeedViewProps) {
  const [events, setEvents] = useState<MyActivityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback((p: number) => {
    const first = p === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    return issuesApi
      .myActivity({ page: p, limit: PAGE_SIZE })
      .then((res) => {
        setEvents((prev) => (first ? res.items : [...prev, ...res.items]));
        setTotalPages(res.pagination?.totalPages ?? 1);
        setPage(p);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const hasMore = page < totalPages;

  return (
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="p-4 md:p-6 xl:p-8">
        <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-7xl">
          {/* Heading */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Back to dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
              style={{ borderColor: t.cardBorder, color: t.textSub }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: t.text }}>
                Activity Timeline
              </h1>
              <p className="mt-1 text-sm" style={{ color: t.textSub }}>
                The full lifecycle of the reports you filed or supported.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              Couldn't load your activity. Please try again.
            </div>
          )}

          <div
            className="rounded-3xl border p-5 md:p-6"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)",
              borderColor: t.cardBorder,
              boxShadow: t.cardShadow,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: t.divider }} />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: t.textSub }}>
                You haven't filed or supported any reports yet.
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full" style={{ background: t.divider }} />
                <div className="flex flex-col gap-5">
                  {events.map((e, i) => {
                    const color = STATUS_COLOR[e.status] ?? "#2563EB";
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 10) * 0.04 }}
                        className="flex items-start gap-4"
                      >
                        <span
                          className="absolute left-0 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2"
                          style={{ background: color, borderColor: color, boxShadow: `0 0 0 3px ${color}22` }}
                        />
                        <button
                          onClick={() => e.issueId && onSelect(e.issueId)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="mb-0.5 font-mono text-xs" style={{ color: t.textMuted }}>
                            {timeAgo(e.createdAt)}
                          </p>
                          <p className="text-sm font-semibold" style={{ color: t.text }}>
                            {activityLabel(e)}
                          </p>
                          <p className="truncate text-xs" style={{ color: t.textSub }}>
                            {e.issueTitle}
                            {e.reportType === "merged" ? " · supported" : ""}
                          </p>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasMore && !loading && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="rounded-full border px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
                  style={{ borderColor: t.cardBorder, color: t.text }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
