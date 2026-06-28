import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  admin,
  categoryLabel,
  statusLabel,
  shortId,
  timeAgo,
  priorityColor,
  CATEGORY_OPTIONS,
  type Issue,
  type IssueCategory,
  type IssueStatus,
  type Pagination,
} from "../../../lib";

// Title-cases a priority enum value (e.g. "CRITICAL" → "Critical").
function priorityLabel(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

// Badge colours per lifecycle status (text + subtle background).
const STATUS_COLORS: Record<IssueStatus, { fg: string; bg: string }> = {
  REPORTED:         { fg: "#D97706", bg: "rgba(217,119,6,0.12)" },
  VERIFIED:         { fg: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  ASSIGNED:         { fg: "#7C3AED", bg: "rgba(124,58,237,0.12)" },
  ENGINEER_VISITED: { fg: "#0891B2", bg: "rgba(8,145,178,0.12)" },
  REPAIR_STARTED:   { fg: "#CA8A04", bg: "rgba(202,138,4,0.12)" },
  COMPLETED:        { fg: "#16A34A", bg: "rgba(22,163,74,0.12)" },
  REJECTED:         { fg: "#DC2626", bg: "rgba(220,38,38,0.12)" },
};

const STATUS_OPTIONS: IssueStatus[] = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
  "COMPLETED",
  "REJECTED",
];

const PAGE_SIZE = 12;

const fieldClass =
  "rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-blue-400";

export function AdminReports() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [page, setPage] = useState(1);

  // The id currently being updated (disables its select while in flight).
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Show the loading state + clear errors during render whenever the request
  // inputs change — avoids calling setState synchronously inside an effect.
  const reqSig = `${page}|${debouncedSearch}|${status}|${category}`;
  const [startedSig, setStartedSig] = useState<string | null>(null);
  if (reqSig !== startedSig) {
    setStartedSig(reqSig);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    admin.issues
      .list({
        page,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
      })
      .then((r) => {
        if (!active) return;
        setIssues(r.items);
        setPagination(r.pagination ?? null);
      })
      .catch(() => { if (active) setError("Couldn't load reports. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, debouncedSearch, status, category]);

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? issues.length;

  async function handleStatusChange(issue: Issue, next: IssueStatus) {
    if (next === issue.status) return;
    setUpdatingId(issue.id);
    try {
      const updated = await admin.issues.updateStatus(issue.id, next);
      setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: updated.status } : i)));
    } catch {
      setError("Couldn't update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const showingRange = useMemo(() => {
    if (total === 0) return "0";
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start}–${end} of ${total}`;
  }, [page, total]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* Heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and triage every community report.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
          <FileText className="h-4 w-4" />
          {total} total
        </span>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title or location…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as IssueStatus | ""); setPage(1); }}
          className={fieldClass}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value as IssueCategory | ""); setPage(1); }}
          className={fieldClass}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Report ID</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Priority</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Upvotes</th>
                <th className="px-5 py-3 text-right font-semibold">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No reports match your filters.
                  </td>
                </tr>
              ) : (
                issues.map((issue) => {
                  const c = STATUS_COLORS[issue.status];
                  const location = issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`;
                  const upvotes = issue._count?.votes ?? 0;
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => navigate(`/admin/reports/${issue.id}`)}
                      className="cursor-pointer transition-colors hover:bg-accent"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-muted-foreground">
                        {shortId(issue.id)}
                      </td>
                      <td className="max-w-[220px] px-5 py-3.5">
                        <span className="block truncate font-semibold text-foreground">{issue.title}</span>
                      </td>
                      <td className="max-w-[200px] px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{location}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                        {categoryLabel(issue.category)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ color: priorityColor(issue.priority), background: `${priorityColor(issue.priority)}1A` }}
                        >
                          {priorityLabel(issue.priority)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={issue.status}
                          disabled={updatingId === issue.id}
                          onChange={(e) => handleStatusChange(issue, e.target.value as IssueStatus)}
                          className="cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none disabled:opacity-50"
                          style={{ color: c.fg, background: c.bg }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-card text-foreground">
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="inline-flex items-center justify-end gap-1 font-semibold text-muted-foreground">
                          <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
                          {upvotes}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-muted-foreground">
                        {timeAgo(issue.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && issues.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-xs font-medium text-muted-foreground">Showing {showingRange}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
