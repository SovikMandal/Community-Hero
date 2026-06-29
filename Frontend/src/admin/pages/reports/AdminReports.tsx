import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GridBackground } from "../../../components/GridBackground";
import {
  Search,
  MapPin,
  ChevronUp,
  FileText,
  Loader2,
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
} from "../../../lib";

// Title-cases a priority enum value (e.g. "CRITICAL" → "Critical").
function priorityLabel(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

// Badge colours per lifecycle status (text + subtle background).
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

const STATUS_OPTIONS: IssueStatus[] = [
  "REPORTED",
  "ACCEPTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
  "COMPLETED",
  "REJECTED",
];

const PAGE_SIZE = 10;

const fieldClass =
  "rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-blue-400";

export function AdminReports({ isDark }: { isDark?: boolean }) {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);          // initial / filter-change load
  const [loadingMore, setLoadingMore] = useState(false); // appending the next page
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<IssueStatus | "">("");
  const [category, setCategory] = useState<IssueCategory | "">("");

  // The id currently being updated (disables its select while in flight).
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset and load the first page whenever the filters change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    admin.issues
      .list({
        page: 1,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
      })
      .then((r) => {
        if (!active) return;
        setIssues(r.items);
        setPage(1);
        setTotalPages(r.pagination?.totalPages ?? 1);
        setTotal(r.pagination?.total ?? r.items.length);
      })
      .catch(() => { if (active) setError("Couldn't load reports. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, status, category]);

  const hasMore = page < totalPages;

  // Append the next page. Guarded so fast scrolling / end-of-list can't fire
  // duplicate or out-of-range requests.
  const loadMore = useCallback(() => {
    if (loading || loadingMore || page >= totalPages) return;
    const next = page + 1;
    setLoadingMore(true);
    admin.issues
      .list({
        page: next,
        limit: PAGE_SIZE,
        q: debouncedSearch || undefined,
        status: status || undefined,
        category: category || undefined,
      })
      .then((r) => {
        setIssues((prev) => [...prev, ...r.items]);
        setPage(next);
        setTotalPages(r.pagination?.totalPages ?? totalPages);
      })
      .catch(() => setError("Couldn't load more reports. Please try again."))
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, page, totalPages, debouncedSearch, status, category]);

  // Infinite scroll: load the next page when the sentinel near the list bottom
  // scrolls into view. rootMargin pre-fetches slightly before the actual end.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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

  return (
    <div className="relative min-h-full">
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-blue-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as IssueStatus | "")}
          className={fieldClass}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IssueCategory | "")}
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
      </div>

      {/* Infinite-scroll sentinel + loader */}
      <div ref={sentinelRef} className="h-px" />
      {loadingMore && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more reports…
        </div>
      )}
      {!loading && !loadingMore && !hasMore && issues.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You've reached the end · {total} report{total === 1 ? "" : "s"} total
        </p>
      )}
    </div>
      </div>
    </div>
  );
}
