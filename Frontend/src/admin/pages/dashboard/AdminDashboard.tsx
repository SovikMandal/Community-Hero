import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { GridBackground } from "../../../components/GridBackground";
import { AdminMission } from "./AdminMission";
import {
  FileText,
  CheckCircle2,
  Building2,
  Users,
  MapPin,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import {
  admin,
  categoryLabel,
  statusLabel,
  shortId,
  timeAgo,
  type AdminOverview,
  type AdminActivityEvent,
  type Issue,
  type IssueStatus,
} from "../../../lib";

// Badge colours per lifecycle status (text + subtle background). These read
// well on both light and dark surfaces.
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

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

// A single labelled progress bar in the issue pipeline.
function PipelineBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// Friendly action labels for each lifecycle stage shown in the activity feed.
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

// Vertical activity feed mirroring the citizen dashboard's Activity Timeline.
// Renders real lifecycle events (reported → verified → routed → inspected →
// repair started → completed) across all reports.
function ActivityTimeline({ events, onViewAll, onSelect }: { events: AdminActivityEvent[]; onViewAll?: () => void; onSelect?: (issueId: string) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Activity Timeline</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Recent report lifecycle activity</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">No activity yet.</div>
      ) : (
        <div className="px-5 py-6">
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full bg-border" />
            <div className="flex flex-col gap-5">
              {events.map((e, i) => {
                const color = STATUS_COLORS[e.status]?.fg ?? "#2563EB";
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-4"
                  >
                    <span
                      className="absolute left-0 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2"
                      style={{ background: color, borderColor: color, boxShadow: `0 0 0 3px ${color}22` }}
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => e.issueId && onSelect?.(e.issueId)}
                      className="min-w-0 text-left cursor-pointer rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-colors hover:bg-accent"
                    >
                      <p className="mb-0.5 font-mono text-xs text-muted-foreground">{timeAgo(e.createdAt)}</p>
                      <p className="text-sm font-semibold text-foreground">{activityLabel(e)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.issueTitle}
                        {e.actor ? ` · by ${e.actor}` : ""}
                      </p>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({ isDark }: { isDark?: boolean }) {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    admin
      .overview()
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    // Activity feed loads independently so it never blocks the headline stats.
    admin
      .activity({ limit: 6 })
      .then((r) => { if (active) setActivity(r.items); })
      .catch(() => { /* non-critical — timeline simply stays empty */ });
    return () => { active = false; };
  }, []);

  const byStatus = data?.issues.byStatus ?? {};
  const total = data?.issues.total ?? 0;
  const recent: Issue[] = data?.recentIssues ?? [];

  // Pipeline stages mirror the citizen dashboard's resolution stages.
  const pipeline = [
    { label: "Reported",  value: byStatus.REPORTED ?? 0, color: "#2563EB" },
    { label: "Verified",  value: byStatus.VERIFIED ?? 0, color: "#8B5CF6" },
    { label: "Assigned",  value: byStatus.ASSIGNED ?? 0, color: "#F59E0B" },
    { label: "Completed", value: byStatus.COMPLETED ?? 0, color: "#22C55E" },
  ];

  return (
    <div className="relative min-h-full">
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of community reports and resolution performance.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          Couldn't load dashboard data. Please try again.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Admin mission — the most pressing operational action */}
          <AdminMission isDark={isDark} data={data} onAction={() => navigate("/admin/reports")} />

          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FileText} label="Total Reports" value={String(total)} accent="#2563EB" />
            <StatCard icon={CheckCircle2} label="Resolved" value={String(data?.issues.resolved ?? 0)} accent="#16A34A" />
            <StatCard icon={Building2} label="Departments" value={String(data?.departments ?? 0)} accent="#7C3AED" />
            <StatCard icon={Users} label="Active Citizens" value={String(data?.users.citizens ?? 0)} accent="#D97706" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Issue pipeline */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Issue Pipeline</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Report resolution stages</p>
                </div>
                <span className="rounded-xl bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">{total} total</span>
              </div>
              <div className="flex flex-col gap-4 px-5 py-5">
                {pipeline.map((p) => (
                  <PipelineBar key={p.label} label={p.label} value={p.value} max={total} color={p.color} />
                ))}
              </div>
            </div>

            {/* Recent reports */}
            <div className="rounded-2xl border border-border bg-card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Recent Reports</h2>
                <span className="text-xs font-medium text-muted-foreground">Latest {recent.length}</span>
              </div>
              {recent.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">No reports yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {recent.map((issue) => {
                    const c = STATUS_COLORS[issue.status];
                    const location =
                      issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`;
                    const upvotes = issue._count?.votes ?? 0;
                    return (
                      <div key={issue.id} className="flex items-center gap-3 px-5 py-3.5 sm:gap-4">
                        {/* Report ID */}
                        <span className="w-16 flex-shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:w-20">
                          {shortId(issue.id)}
                        </span>

                        {/* Location */}
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate text-sm">{location}</span>
                        </div>

                        {/* Category */}
                        <span className="hidden w-28 flex-shrink-0 truncate text-xs font-medium text-muted-foreground sm:block">
                          {categoryLabel(issue.category)}
                        </span>

                        {/* Status badge */}
                        <span
                          className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          {statusLabel(issue.status)}
                        </span>

                        {/* Upvotes */}
                        <span className="flex w-12 flex-shrink-0 items-center justify-end gap-1 text-xs font-semibold text-muted-foreground">
                          <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
                          {upvotes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          <div className="mt-6">
            <ActivityTimeline events={activity} onViewAll={() => navigate("/admin/activity")} onSelect={(id) => navigate(`/admin/reports/${id}`)} />
          </div>
        </>
      )}
    </div>
      </div>
    </div>
  );
}
