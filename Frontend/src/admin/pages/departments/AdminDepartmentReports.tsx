import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ChevronUp,
  FileText,
} from "lucide-react";
import {
  admin,
  categoryLabel,
  statusLabel,
  shortId,
  timeAgo,
  priorityColor,
  type Issue,
  type IssueStatus,
  type DepartmentWithStats,
  type Pagination,
} from "../../../lib";
import { GridBackground } from "../../../components/GridBackground";

const STATUS_COLORS: Record<IssueStatus, { fg: string; bg: string }> = {
  REPORTED:         { fg: "#D97706", bg: "rgba(217,119,6,0.12)" },
  ACCEPTED:         { fg: "#0EA5E9", bg: "rgba(14,165,233,0.12)" },
  VERIFIED:         { fg: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  ASSIGNED:         { fg: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  ENGINEER_VISITED: { fg: "#0891B2", bg: "rgba(8,145,178,0.12)" },
  REPAIR_STARTED:   { fg: "#CA8A04", bg: "rgba(202,138,4,0.12)" },
  COMPLETED:        { fg: "#16A34A", bg: "rgba(22,163,74,0.12)" },
  REJECTED:         { fg: "#DC2626", bg: "rgba(220,38,38,0.12)" },
};

const PAGE_SIZE = 12;

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

export function AdminDepartmentReports({ isDark }: { isDark?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dept, setDept] = useState<DepartmentWithStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Resolve the department (name + stats) for the header.
  useEffect(() => {
    let active = true;
    admin
      .departments.list()
      .then((list) => {
        if (active) setDept(list.find((d) => d.id === id) ?? null);
      })
      .catch(() => { /* header just shows a fallback */ });
    return () => { active = false; };
  }, [id]);

  const loadIssues = useCallback(
    (p: number) => {
      if (!id) return Promise.resolve();
      setLoading(true);
      return admin.issues
        .list({ departmentId: id, page: p, limit: PAGE_SIZE, routed: true })
        .then((res) => {
          setIssues(res.items);
          setPagination(res.pagination ?? null);
          setPage(p);
          setError(false);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    },
    [id],
  );

  useEffect(() => {
    loadIssues(1);
  }, [loadIssues]);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="relative min-h-full">
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          {/* Header */}
          <div className="mb-6 flex items-start gap-3">
            <button
              onClick={() => navigate("/admin/departments")}
              aria-label="Back to departments"
              className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {dept?.name ?? "Department"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {dept?.description || "Reports routed to this department."}
              </p>
              {dept && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatChip label="Total" value={dept.stats.total} color="#2563EB" />
                  <StatChip label="In Progress" value={dept.stats.inProgress} color="#F59E0B" />
                  <StatChip label="Resolved" value={dept.stats.resolved} color="#16A34A" />
                  <StatChip label="Rejected" value={dept.stats.rejected} color="#DC2626" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load reports. Please try again.
            </div>
          )}

          {/* Reports list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No reports routed to this department yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {issues.map((issue, i) => {
                const c = STATUS_COLORS[issue.status];
                const location =
                  issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`;
                return (
                  <motion.button
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.04 }}
                    onClick={() => navigate(`/admin/departments/reports/${issue.id}`)}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-4"
                  >
                    <span className="w-16 flex-shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:w-20">
                      {shortId(issue.id)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{issue.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                        <span className="hidden sm:inline">· {categoryLabel(issue.category)}</span>
                        <span>· {timeAgo(issue.createdAt)}</span>
                      </div>
                    </div>

                    {/* Priority */}
                    <span
                      className="hidden flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-white sm:inline"
                      style={{ background: priorityColor(issue.priority) }}
                    >
                      {issue.priority}
                    </span>

                    {/* Status */}
                    <span
                      className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: c.bg, color: c.fg }}
                    >
                      {statusLabel(issue.status)}
                    </span>

                    {/* Upvotes */}
                    <span className="hidden w-12 flex-shrink-0 items-center justify-end gap-1 text-xs font-semibold text-muted-foreground sm:flex">
                      <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
                      {issue._count?.votes ?? 0}
                    </span>

                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => loadIssues(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadIssues(page + 1)}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDepartmentReports;
