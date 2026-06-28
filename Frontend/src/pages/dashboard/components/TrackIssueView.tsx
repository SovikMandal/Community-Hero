import { useState, useEffect } from "react";
import { MapPin, Search, Check, Target, FileText, Bell, CheckCircle2, Clock, RefreshCw, Ban } from "lucide-react";
import { issues as issuesApi, timeAgo, categoryLabel, statusLabel, type Issue, type IssueStatus } from "../../../lib";
import type { DashboardTheme } from "../theme";
import { TrackIssueSkeleton } from "../../PageSkeletons";

interface TrackIssueViewProps {
  issueId: string;
  isDark: boolean;
  t: DashboardTheme;
}

/** Ordered lifecycle stages an issue passes through. */
const STATUS_STAGES: { status: IssueStatus; label: string; defaultDesc: string }[] = [
  { status: "REPORTED",          label: "Report submitted",   defaultDesc: "Your issue was received and assigned a tracking ID." },
  { status: "ACCEPTED",          label: "Accepted",           defaultDesc: "Your report was accepted for review." },
  { status: "VERIFIED",          label: "Verified",           defaultDesc: "The issue has been verified by the community or staff." },
  { status: "ASSIGNED",          label: "Assigned",           defaultDesc: "Department notified and case queued." },
  { status: "ENGINEER_VISITED",  label: "Field inspection",   defaultDesc: "An officer has visited the site." },
  { status: "REPAIR_STARTED",    label: "Repair started",     defaultDesc: "Work is in progress." },
  { status: "COMPLETED",         label: "Completed",          defaultDesc: "Issue resolved." },
];

export function TrackIssueView({ issueId, isDark, t }: TrackIssueViewProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch whenever the id changes or a manual refresh is requested. The `active`
  // flag makes this race-safe: if the id changes (or the component unmounts) while
  // a request is in flight, that response is ignored instead of overwriting newer
  // data or updating an unmounted component.
  useEffect(() => {
    let active = true;
    issuesApi.get(issueId)
      .then((data) => { if (active) { setIssue(data); setErrorId(null); } })
      .catch(() => { if (active) setErrorId(issueId); })
      .finally(() => { if (active) setRefreshing(false); });
    return () => { active = false; };
  }, [issueId, refreshTick]);

  // Loading is derived: we're still loading until we hold the issue for the
  // current id. A failed initial load shows "not found"; a failed refresh keeps
  // the existing content rather than blanking it out.
  if (!issue || issue.id !== issueId) {
    if (errorId === issueId) {
      return <div className="flex-1 flex items-center justify-center" style={{ color: t.textSub }}>Issue not found</div>;
    }
    return <TrackIssueSkeleton />;
  }

  const loc = issue.address ?? `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`;
  const issueStatusLabel = statusLabel(issue.status);
  const priorityColor = issue.priority === "CRITICAL" ? "#DC2626" : issue.priority === "HIGH" ? "#D97706" : "#2563EB";
  const statusColor = issue.status === "COMPLETED" ? "#16A34A" : issue.status === "REJECTED" ? "#DC2626" : "#D97706";

  // Build a lookup from real timeline events so we can show actual timestamps & notes
  const timelineByStatus = new Map<IssueStatus, { note?: string | null; createdAt: string }>();
  if (issue.timeline) {
    for (const event of issue.timeline) {
      // Keep the latest event per status (timeline is ordered asc from API)
      timelineByStatus.set(event.status, { note: event.note, createdAt: event.createdAt });
    }
  }

  // Handle REJECTED as a special terminal status
  const isRejected = issue.status === "REJECTED";

  // Determine the furthest stage reached — from the current status and any
  // logged timeline events — so every stage up to and including it counts as done.
  const stageOrder = STATUS_STAGES.map((s) => s.status);
  let currentIndex = stageOrder.indexOf(issue.status); // -1 when REJECTED
  for (const event of issue.timeline ?? []) {
    currentIndex = Math.max(currentIndex, stageOrder.indexOf(event.status));
  }

  // Build enriched timeline steps. A stage is "done" when it is at or before the
  // furthest reached stage (cumulative), even if it has no explicit event logged.
  const timelineSteps = STATUS_STAGES.map((stage, i) => {
    const realEvent = timelineByStatus.get(stage.status);
    const done = i <= currentIndex;
    return {
      label: stage.status === "ASSIGNED" && issue.department?.name
        ? `Routed to ${issue.department.name}`
        : stage.label,
      desc: realEvent?.note ?? stage.defaultDesc,
      timestamp: realEvent?.createdAt ?? null,
      done,
    };
  });

  // If rejected, append that as an extra step
  if (isRejected) {
    const rejectedEvent = timelineByStatus.get("REJECTED");
    timelineSteps.push({
      label: "Rejected",
      desc: rejectedEvent?.note ?? "This issue was rejected.",
      timestamp: rejectedEvent?.createdAt ?? null,
      done: true,
    });
  }

  // Current stage = the last completed step from real timeline, fallback to issue status
  const lastDoneStep = [...timelineSteps].reverse().find(s => s.done);
  const currentStage = lastDoneStep?.label ?? statusLabel(issue.status);

  // Rejection reason for the prominent banner. Ignore the generic auto-note so we
  // only surface a real, admin-written explanation.
  const rejectionNote = timelineByStatus.get("REJECTED")?.note?.trim();
  const rejectionReason =
    rejectionNote && rejectionNote !== "Status changed to REJECTED" ? rejectionNote : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6" style={{ scrollbarWidth: "none" }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm" style={{ color: t.textSub }}>{new Date(issue.createdAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="font-semibold text-2xl md:text-3xl tracking-tight" style={{ color: t.text }}>Track Issue</h1>
          </div>
          <div className="rounded-full flex px-4 py-2 items-center gap-3 border" style={{ background: t.card, borderColor: t.inputBorder }}>
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex justify-center items-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs" style={{ color: t.textSub }}>Tracking ID</div>
              <div className="font-medium text-sm" style={{ color: t.text }}>CIV-{issue.id.slice(-8).toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-3xl border p-4 md:p-6" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <div className="font-medium text-sm text-blue-500">Live status</div>
              <h2 className="font-semibold text-xl md:text-2xl tracking-tight mt-1" style={{ color: t.text }}>{issue.title}</h2>
              <p className="text-sm mt-2" style={{ color: t.textSub }}>{loc} · Submitted {timeAgo(issue.createdAt)}</p>
            </div>
            <span className="rounded-full text-xs font-semibold px-3 py-1.5" style={{ background: `${statusColor}15`, color: statusColor }}>{issueStatusLabel}</span>
          </div>

          {/* Rejection reason banner */}
          {isRejected && (
            <div className="mt-4 rounded-2xl border p-4 flex items-start gap-3" style={{ background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.35)" }}>
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ background: "rgba(220,38,38,0.15)", color: "#DC2626" }}>
                <Ban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm" style={{ color: "#DC2626" }}>Report rejected</div>
                <p className="text-sm mt-1" style={{ color: t.textSub }}>
                  {rejectionReason ?? "No specific reason was provided. Please contact support or file a new report with more details."}
                </p>
              </div>
            </div>
          )}

          <div className="grid mt-6 gap-4">
            {/* Timeline */}
            <div className="rounded-2xl border p-4" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(244,244,245,0.3)", borderColor: t.inputBorder }}>
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm" style={{ color: t.text }}>Progress timeline</div>
                <div className="text-xs" style={{ color: t.textSub }}>Updated {timeAgo(issue.updatedAt)}</div>
              </div>
              <div className="space-y-4 mt-4">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex justify-center items-center"
                      style={{
                        background: step.done
                          ? (step.label === "Rejected" ? "#DC2626" : "#2563EB")
                          : t.tagBg,
                        color: step.done ? "white" : t.textMuted,
                      }}>
                      {step.done ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full" style={{ background: t.textMuted }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: step.done ? t.text : t.textMuted }}>{step.label}</div>
                          {step.label === "Rejected" ? (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                              style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}>
                              Rejected
                            </span>
                          ) : step.done ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                              style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                              <Check className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                              style={{ background: t.tagBg, color: t.textMuted }}>
                              Pending
                            </span>
                          )}
                        </div>
                        {step.timestamp && (
                          <div className="flex shrink-0 items-center gap-1 text-xs" style={{ color: t.textSub }}>
                            <Clock className="w-3 h-3" />
                            {timeAgo(step.timestamp)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: t.textSub }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current stage */}
            <div className="rounded-2xl border p-4" style={{ background: t.card, borderColor: t.inputBorder }}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm" style={{ color: t.text }}>Current stage</div>
                  <div className="font-semibold text-2xl mt-1" style={{ color: isRejected ? "#DC2626" : "#2563EB" }}>{currentStage}</div>
                </div>
                <div className="w-14 h-14 rounded-full flex justify-center items-center" style={{ background: isDark ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.08)", color: "#2563EB" }}>
                  <Target className="w-7 h-7" />
                </div>
              </div>
              <div className="grid mt-4 gap-3">
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Department</span>
                  <span className="font-medium text-sm" style={{ color: t.text }}>{issue.department?.name ?? "Pending"}</span>
                </div>
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Priority</span>
                  <span className="font-medium text-sm" style={{ color: priorityColor }}>{issue.priority}</span>
                </div>
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Severity</span>
                  <span className="font-medium text-sm" style={{ color: t.text }}>{issue.severity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location + Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border p-4 md:p-6" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
              <MapPin className="w-4 h-4 text-blue-500" /> Location
            </div>
            <div className="rounded-2xl border overflow-hidden mb-3" style={{ borderColor: t.inputBorder, height: 176 }}>
              <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${issue.latitude},${issue.longitude}&zoom=15&size=400x176&markers=${issue.latitude},${issue.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                alt="map" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: t.textSub }}>Reported at</span>
                <span className="font-medium text-sm" style={{ color: t.text }}>{loc.slice(0, 30)}{loc.length > 30 ? "…" : ""}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: t.textSub }}>GPS verified</span>
                <span className="font-medium text-sm text-emerald-600">Yes</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border p-4 md:p-6" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
              <FileText className="w-4 h-4 text-blue-500" /> Issue details
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl p-4" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                <div className="text-xs" style={{ color: t.textSub }}>Category</div>
                <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{categoryLabel(issue.category)}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                <div className="text-xs" style={{ color: t.textSub }}>AI Summary</div>
                <div className="text-sm mt-1" style={{ color: t.textSub }}>{issue.aiSummary ?? issue.description}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)" }}>
                <div className="text-xs" style={{ color: t.textSub }}>Upvotes</div>
                <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{issue._count?.votes ?? 0} community votes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Updates */}
        {issue.timeline && issue.timeline.length > 0 && (
          <div className="rounded-3xl border p-4 md:p-6" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
              <Bell className="w-4 h-4 text-blue-500" /> Updates
            </div>
            <div className="space-y-3">
              {issue.timeline.map((event) => (
                <div key={event.id} className="rounded-2xl border p-4" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(244,244,245,0.3)", borderColor: t.inputBorder }}>
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm" style={{ color: t.text }}>{statusLabel(event.status)}</div>
                    <div className="text-xs" style={{ color: t.textSub }}>{timeAgo(event.createdAt)}</div>
                  </div>
                  {event.note && <p className="text-sm mt-2" style={{ color: t.textSub }}>{event.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="rounded-3xl border flex flex-wrap p-4 justify-between items-center gap-3" style={{ background: t.card, borderColor: t.cardBorder }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: t.textSub }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tracking active
          </div>
          <button onClick={() => { setRefreshing(true); setRefreshTick((n) => n + 1); }} disabled={refreshing}
            className="inline-flex font-semibold rounded-full text-sm px-5 py-2.5 items-center gap-2 text-white disabled:opacity-60"
            style={{ background: "#2563EB" }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
