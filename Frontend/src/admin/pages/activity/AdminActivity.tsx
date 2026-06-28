import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { GridBackground } from "../../../components/GridBackground";
import {
  admin,
  statusLabel,
  timeAgo,
  type AdminActivityEvent,
  type IssueStatus,
} from "../../../lib";

// Status → accent colour (matches the dashboard palette).
const STATUS_FG: Record<IssueStatus, string> = {
  REPORTED: "#D97706",
  ACCEPTED: "#0EA5E9",
  VERIFIED: "#2563EB",
  ASSIGNED: "#7C3AED",
  ENGINEER_VISITED: "#0891B2",
  REPAIR_STARTED: "#CA8A04",
  COMPLETED: "#16A34A",
  REJECTED: "#DC2626",
};

// Friendly action label per lifecycle stage.
function activityLabel(e: AdminActivityEvent): string {
  switch (e.status) {
    case "REPORTED":
      return "New report received";
    case "ACCEPTED":
      return "Report accepted";
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

export function AdminActivity({ isDark }: { isDark?: boolean }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminActivityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback((p: number) => {
    const first = p === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    return admin
      .activity({ page: p, limit: PAGE_SIZE })
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
    <div className="relative min-h-full">
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
      <div className="mx-auto max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 py-6 md:px-8">
      {/* Heading */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Activity Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full lifecycle history across every report.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load activity. Please try again.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full bg-border" />
            <div className="flex flex-col gap-5">
              {events.map((e, i) => {
                const color = STATUS_FG[e.status] ?? "#2563EB";
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
                      onClick={() => e.issueId && navigate(`/admin/reports/${e.issueId}`)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="mb-0.5 font-mono text-xs text-muted-foreground">{timeAgo(e.createdAt)}</p>
                      <p className="text-sm font-semibold text-foreground">{activityLabel(e)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.issueTitle}
                        {e.actor ? ` · by ${e.actor}` : ""}
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
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
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

export default AdminActivity;
