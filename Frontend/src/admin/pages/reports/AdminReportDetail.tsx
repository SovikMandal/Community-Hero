import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Search,
  Check,
  Target,
  FileText,
  Bell,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowLeft,
  Route,
  Building2,
  Send,
  Loader2,
  X,
  Images,
  PlayCircle,
  User as UserIcon,
  GitMerge,
  Sparkles,
} from "lucide-react";
import {
  admin,
  departments as departmentsApi,
  categoryLabel,
  statusLabel,
  timeAgo,
  type Department,
  type Issue,
  type IssueContributor,
  type IssueStatus,
} from "../../../lib";
import { tk } from "../../../pages/dashboard/theme";
import { LocationMap } from "../../../pages/report/components/LocationMap";
import { GridBackground } from "../../../components/GridBackground";

/** Ordered lifecycle stages an issue passes through (mirrors the track page). */
const STATUS_STAGES: { status: IssueStatus; label: string; defaultDesc: string }[] = [
  { status: "REPORTED",         label: "Report submitted", defaultDesc: "The issue was received and assigned a tracking ID." },
  { status: "ACCEPTED",         label: "Accepted",         defaultDesc: "The report was accepted for review by an administrator." },
  { status: "VERIFIED",         label: "Verified",         defaultDesc: "The issue has been verified by the community or staff." },
  { status: "ASSIGNED",         label: "Assigned",         defaultDesc: "Department notified and case queued." },
  { status: "ENGINEER_VISITED", label: "Field inspection", defaultDesc: "An officer has visited the site." },
  { status: "REPAIR_STARTED",   label: "Repair started",   defaultDesc: "Work is in progress." },
  { status: "COMPLETED",        label: "Completed",        defaultDesc: "Issue resolved." },
];

// Hardcoded field inspectors a department can assign to a report.
const FIELD_INSPECTORS = [
  "Rajesh Kumar",
  "Anita Sharma",
  "Vikram Singh",
  "Priya Menon",
  "Arjun Reddy",
];

export function AdminReportDetail({ isDark = true, mode = "admin" }: { isDark?: boolean; mode?: "admin" | "department" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = tk(isDark);
  // In "department" mode the page is reached from a department's report list:
  // the routing/accept/reject controls (admin's job) are hidden and replaced
  // with the department's own progress actions.
  const isDepartment = mode === "department";

  const [issue, setIssue] = useState<Issue | null>(null);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [contributors, setContributors] = useState<IssueContributor[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [generatingReason, setGeneratingReason] = useState(false);
  // Department mode: client-side "accepted the assignment" gate. It's also
  // implied once a field inspector has been assigned (status ENGINEER_VISITED+).
  const [deptAcceptedLocal, setDeptAcceptedLocal] = useState(false);

  const loadIssue = useCallback(() => {
    if (!id) return Promise.resolve();
    return admin.issues
      .get(id)
      .then((iss) => {
        setIssue(iss);
        setError(null);
      })
      .catch(() => setError("Could not load this report."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartmentList)
      .catch(() => { /* department list is optional */ });
  }, []);

  // Load report contributors (creator + everyone who merged a duplicate),
  // enriched with each user's leaderboard rank + points.
  useEffect(() => {
    if (!id) {
      setContributors([]);
      return;
    }
    admin.issues
      .contributors(id)
      .then(setContributors)
      .catch(() => setContributors([]));
  }, [id]);

  const runAction = useCallback(
    (action: () => Promise<unknown>) => {
      setBusy(true);
      return Promise.resolve(action())
        .then(() => loadIssue())
        .catch(() => setError("Action failed. Please try again."))
        .finally(() => setBusy(false));
    },
    [loadIssue],
  );

  const handleStatus = (status: IssueStatus) => id && runAction(() => admin.issues.updateStatus(id, status));

  // Status change with an explicit timeline note (used by department actions:
  // inspector assignment, work-progress changes, issue resolution).
  const handleStatusNote = (status: IssueStatus, note: string) =>
    id && runAction(() => admin.issues.updateStatus(id, status, note));

  const handleAssign = (departmentId: string) => {
    if (!id || !departmentId) return;
    setAssigning(false);
    runAction(() => admin.issues.assign(id, departmentId));
  };

  // ── Reject-with-reason flow ────────────────────────────────────────────────
  const openRejectModal = () => {
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleGenerateReason = () => {
    if (!id) return;
    setGeneratingReason(true);
    admin.issues
      .generateRejectReason(id)
      .then((reason) => setRejectReason(reason))
      .catch(() => setError("Couldn't generate a reason. Please write one manually."))
      .finally(() => setGeneratingReason(false));
  };

  const submitRejection = () => {
    if (!id) return;
    const note = rejectReason.trim();
    if (!note) return;
    setRejectOpen(false);
    runAction(() => admin.issues.updateStatus(id, "REJECTED", note));
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center" style={{ color: t.textSub }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: t.textSub }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </button>
        <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ background: `${"#DC2626"}15`, borderColor: "#DC2626", color: "#DC2626" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const loc = issue.address ?? `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`;
  const issueStatusLabel = statusLabel(issue.status);
  const priorityColor = issue.priority === "CRITICAL" ? "#DC2626" : issue.priority === "HIGH" ? "#D97706" : "#2563EB";
  const statusColor = issue.status === "COMPLETED" ? "#16A34A" : issue.status === "REJECTED" ? "#DC2626" : "#D97706";

  // Real timeline lookups for timestamps + notes.
  const timelineByStatus = new Map<IssueStatus, { note?: string | null; createdAt: string }>();
  for (const event of issue.timeline ?? []) {
    timelineByStatus.set(event.status, { note: event.note, createdAt: event.createdAt });
  }

  const isRejected = issue.status === "REJECTED";
  const stageOrder = STATUS_STAGES.map((s) => s.status);
  let currentIndex = stageOrder.indexOf(issue.status);
  for (const event of issue.timeline ?? []) {
    currentIndex = Math.max(currentIndex, stageOrder.indexOf(event.status));
  }

  const timelineSteps = STATUS_STAGES.map((stage, i) => {
    const realEvent = timelineByStatus.get(stage.status);
    return {
      label: stage.status === "ASSIGNED" && issue.department?.name ? `Routed to ${issue.department.name}` : stage.label,
      desc: realEvent?.note ?? stage.defaultDesc,
      timestamp: realEvent?.createdAt ?? null,
      done: i <= currentIndex,
    };
  });
  if (isRejected) {
    const rejectedEvent = timelineByStatus.get("REJECTED");
    timelineSteps.push({
      label: "Rejected",
      desc: rejectedEvent?.note ?? "This issue was rejected.",
      timestamp: rejectedEvent?.createdAt ?? null,
      done: true,
    });
  }

  const lastDoneStep = [...timelineSteps].reverse().find((s) => s.done);
  const currentStage = lastDoneStep?.label ?? statusLabel(issue.status);

  // Once completed OR rejected, the report is terminal — admin actions are locked.
  const locked = issue.status === "COMPLETED" || isRejected;

  // Routing/progress actions require the report to be accepted (verified) first.
  const accepted = currentIndex >= stageOrder.indexOf("VERIFIED");
  // Department progress actions unlock once an admin has routed (assigned) it.
  const routed = currentIndex >= stageOrder.indexOf("ASSIGNED");
  // A field inspector has been assigned once the report reached ENGINEER_VISITED.
  const inspectorAssigned = currentIndex >= stageOrder.indexOf("ENGINEER_VISITED");
  // The department has taken on the case if it accepted locally or already
  // assigned an inspector (which persists the acceptance).
  const deptAccepted = deptAcceptedLocal || inspectorAssigned;
  // Recover the assigned inspector's name from the ENGINEER_VISITED note.
  const inspectorName = (() => {
    const ev = [...(issue.timeline ?? [])].reverse().find((e) => e.status === "ENGINEER_VISITED");
    const m = ev?.note?.match(/inspector assigned:\s*(.+)/i);
    return m ? m[1].trim() : null;
  })();
  // Current work-progress dropdown value derived from the live status.
  const workValue: IssueStatus =
    issue.status === "COMPLETED" ? "COMPLETED" : issue.status === "REPAIR_STARTED" ? "REPAIR_STARTED" : "ENGINEER_VISITED";

  const innerBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)";
  const timelineBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(244,244,245,0.3)";

  // Translucent "glass" card background so the grid background shows through.
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)";
  const blur = { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } as const;

  const actionBtn = "inline-flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="relative flex-1 overflow-y-auto px-4 md:px-8 py-6" style={{ scrollbarWidth: "none" }}>
      <GridBackground isDark={isDark} />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 lg:max-w-6xl xl:max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-1 inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: t.textSub }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to reports
            </button>
            <h1 className="font-semibold text-2xl md:text-3xl tracking-tight" style={{ color: t.text }}>Report Details</h1>
          </div>
          <div className="rounded-full flex px-4 py-2 items-center gap-3 border" style={{ background: cardBg, borderColor: t.inputBorder, ...blur }}>
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
        <div className="rounded-3xl border p-4 md:p-6" style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <div className="font-medium text-sm text-blue-500">Live status</div>
              <h2 className="font-semibold text-xl md:text-2xl tracking-tight mt-1" style={{ color: t.text }}>{issue.title}</h2>
              <p className="text-sm mt-2 mb-3" style={{ color: t.textSub }}>{loc} · Submitted {timeAgo(issue.createdAt)}</p>
            </div>
            <span className="rounded-full text-xs font-semibold px-3 py-1.5" style={{ background: `${statusColor}15`, color: statusColor }}>{issueStatusLabel}</span>
          </div>

          {/* Accept / Reject actions */}
          <div className="grid grid-cols-2 gap-3 mx-5">
            <button
              onClick={() => (isDepartment ? setDeptAcceptedLocal(true) : handleStatus("ACCEPTED"))}
              disabled={isDepartment
                ? (busy || locked || !routed || deptAccepted)
                : (busy || locked || isRejected || currentIndex >= stageOrder.indexOf("ACCEPTED"))}
              className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#16A34A" }}
            >
              <CheckCircle2 className="w-4 h-4" /> Accept report
            </button>
            <button
              onClick={openRejectModal}
              disabled={busy || locked || isRejected}
              className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}
            >
              <X className="w-4 h-4" /> Reject report
            </button>
          </div>

          {/* User details */}
          {/* User details — report creator + everyone who merged a duplicate */}
          <div className="rounded-2xl border p-4 mt-4" style={{ background: timelineBg, borderColor: t.inputBorder }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: t.text }}>
              <UserIcon className="w-4 h-4 text-blue-500" /> User details
              {contributors.length > 0 && (
                <span className="text-xs font-normal" style={{ color: t.textSub }}>({contributors.length})</span>
              )}
            </div>

            {contributors.length === 0 ? (
              <div className="rounded-xl px-4 py-6 text-center text-sm" style={{ background: innerBg, color: t.textSub }}>
                No contributor details available for this report.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border" style={{ borderColor: t.inputBorder }}>
                <table className="w-full text-left text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: innerBg }}>
                      {["#", "ID Number", "Name", "Email", "Type", "Rank", "Points"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: t.textSub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.map((c) => {
                      const merged = c.type === "merged";
                      return (
                        <tr key={c.userId} className="border-t" style={{ borderColor: t.inputBorder }}>
                          <td className="px-3 py-2.5 font-medium" style={{ color: t.text }}>{c.index}</td>
                          <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: t.textSub }}>{c.userId}</td>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.name}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: t.textSub }}>{c.email}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                              style={{
                                background: merged ? "rgba(217,119,6,0.12)" : "rgba(37,99,235,0.12)",
                                color: merged ? "#D97706" : "#2563EB",
                              }}
                            >
                              {merged ? <GitMerge className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              {merged ? "merged" : "created"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.rank != null ? `#${c.rank}` : "—"}</td>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.points.toLocaleString()} pts</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid mt-6 gap-4">
            {/* Timeline */}
            <div className="rounded-2xl border p-4" style={{ background: timelineBg, borderColor: t.inputBorder }}>
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm" style={{ color: t.text }}>Progress timeline</div>
                <div className="text-xs" style={{ color: t.textSub }}>Updated {timeAgo(issue.updatedAt)}</div>
              </div>
              <div className="space-y-4 mt-4">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full shrink-0 mt-0.5 flex justify-center items-center"
                      style={{
                        background: step.done ? (step.label === "Rejected" ? "#DC2626" : "#2563EB") : t.tagBg,
                        color: step.done ? "white" : t.textMuted,
                      }}>
                      {step.done ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full" style={{ background: t.textMuted }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: step.done ? t.text : t.textMuted }}>{step.label}</div>
                          {step.label === "Rejected" ? (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}>Rejected</span>
                          ) : step.done ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                              <Check className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5" style={{ background: t.tagBg, color: t.textMuted }}>Pending</span>
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
            <div className="rounded-2xl border p-4" style={{ background: "transparent", borderColor: t.inputBorder }}>
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
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: innerBg }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Department</span>
                  <span className="font-medium text-sm" style={{ color: t.text }}>{issue.department?.name ?? "Pending"}</span>
                </div>
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: innerBg }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Priority</span>
                  <span className="font-medium text-sm" style={{ color: priorityColor }}>{issue.priority}</span>
                </div>
                <div className="rounded-xl flex px-4 py-3 justify-between items-center" style={{ background: innerBg }}>
                  <span className="text-sm" style={{ color: t.textSub }}>Severity</span>
                  <span className="font-medium text-sm" style={{ color: t.text }}>{issue.severity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location + Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border p-4 md:p-6" style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
              <MapPin className="w-4 h-4 text-blue-500" /> Location
            </div>
            <div className="rounded-2xl border overflow-hidden mb-3" style={{ borderColor: t.inputBorder, height: 200 }}>
              <LocationMap lat={issue.latitude} lng={issue.longitude} isDark={isDark} />
            </div>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: innerBg }}>
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

          <div className="rounded-3xl border p-4 md:p-6" style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium text-sm flex items-center gap-2" style={{ color: t.text }}>
                <FileText className="w-4 h-4 text-blue-500" /> Issue details
              </div>
              <button
                onClick={() => setShowImages(true)}
                disabled={!issue.images || issue.images.length === 0}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
                style={{ borderColor: t.inputBorder, color: t.text, background: innerBg }}
              >
                <Images className="w-3.5 h-3.5 text-blue-500" />
                View images
                {issue.images && issue.images.length > 0 && (
                  <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: "rgba(37,99,235,0.15)", color: "#2563EB" }}>
                    {issue.images.length}
                  </span>
                )}
              </button>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl p-4" style={{ background: innerBg }}>
                <div className="text-xs" style={{ color: t.textSub }}>Category</div>
                <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{categoryLabel(issue.category)}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: innerBg }}>
                <div className="text-xs" style={{ color: t.textSub }}>AI Summary</div>
                <div className="text-sm mt-1" style={{ color: t.textSub }}>{issue.aiSummary ?? issue.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4" style={{ background: innerBg }}>
                  <div className="text-xs" style={{ color: t.textSub }}>Upvotes</div>
                  <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{issue._count?.votes ?? 0}</div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: innerBg }}>
                  <div className="text-xs" style={{ color: t.textSub }}>Reported by</div>
                  <div className="font-medium text-sm mt-1 truncate" style={{ color: t.text }}>{issue.reporter?.name ?? "Citizen Anonymous"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin actions */}
        <div className="rounded-3xl border p-4 md:p-6" style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}>
          <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
            <Route className="w-4 h-4 text-blue-500" /> {isDepartment ? "Department actions" : "Admin actions"}
          </div>
          {isDepartment ? (
            <>
              {!routed && !locked && (
                <div className="mb-4 rounded-2xl border px-4 py-2.5 text-xs font-medium flex items-center gap-2" style={{ background: "rgba(217,119,6,0.10)", borderColor: "rgba(217,119,6,0.35)", color: "#D97706" }}>
                  <Clock className="w-3.5 h-3.5" /> This report hasn't been routed to your department yet. Actions unlock once an admin assigns it.
                </div>
              )}

              {routed && !deptAccepted && !locked && (
                <div className="rounded-2xl border px-4 py-2.5 text-xs font-medium flex items-center gap-2" style={{ background: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.30)", color: "#2563EB" }}>
                  <Clock className="w-3.5 h-3.5" /> Accept the report (top of the page) to begin handling it, or reject it.
                </div>
              )}

              {routed && deptAccepted && (
                <div className="flex flex-col gap-4">
                  {/* Assign field inspector */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium" style={{ color: t.textSub }}>Field inspector</div>
                    {inspectorAssigned ? (
                      <div className="flex items-center justify-between gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: t.inputBorder, color: t.text, background: innerBg }}>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <UserIcon className="w-4 h-4 text-blue-500" /> {inspectorName ?? "Assigned"}
                        </span>
                        <span className="text-xs" style={{ color: t.textSub }}>Assigned</span>
                      </div>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => e.target.value && handleStatusNote("ENGINEER_VISITED", `Field inspector assigned: ${e.target.value}`)}
                        disabled={busy || locked}
                        className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                        style={{ background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" }}
                      >
                        <option value="" disabled style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#9CA3AF" : "#64748B" }}>Assign a field inspector…</option>
                        {FIELD_INSPECTORS.map((name) => (
                          <option key={name} value={name} style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" }}>{name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Work progress + issue resolved (after an inspector is assigned) */}
                  {inspectorAssigned && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1.5 text-xs font-medium" style={{ color: t.textSub }}>Work progress</div>
                        <select
                          value={workValue}
                          onChange={(e) => {
                            const v = e.target.value as IssueStatus;
                            const note = v === "REPAIR_STARTED" ? "Work in progress" : v === "COMPLETED" ? "Work completed" : "Work not started";
                            handleStatusNote(v, note);
                          }}
                          disabled={busy || locked}
                          className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                          style={{ background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" }}
                        >
                          <option value="ENGINEER_VISITED" style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" }}>Not started</option>
                          <option value="REPAIR_STARTED" style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" }}>In progress</option>
                          <option value="COMPLETED" style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" }}>Completed</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handleStatusNote("COMPLETED", "Issue resolved")}
                          disabled={busy || locked}
                          className={actionBtn + " w-full justify-center text-white"}
                          style={{ background: "#16A34A" }}
                        >
                          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Issue resolved</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
          {!accepted && !locked && (
            <div className="mb-4 rounded-2xl border px-4 py-2.5 text-xs font-medium flex items-center gap-2" style={{ background: "rgba(217,119,6,0.10)", borderColor: "rgba(217,119,6,0.35)", color: "#D97706" }}>
              <Clock className="w-3.5 h-3.5" /> Verify the report first to enable these actions.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleStatus("VERIFIED")}
              disabled={busy || locked || currentIndex < stageOrder.indexOf("ACCEPTED") || currentIndex >= stageOrder.indexOf("VERIFIED")}
              className={actionBtn + " border"}
              style={{ borderColor: t.inputBorder, color: t.text, background: innerBg }}
            >
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark verified</span>
            </button>

            {assigning ? (
              <select
                autoFocus
                defaultValue=""
                onChange={(e) => handleAssign(e.target.value)}
                disabled={busy}
                className="rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                style={{ background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" }}
              >
                <option value="" disabled style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#9CA3AF" : "#64748B" }}>Select a department…</option>
                {departmentList.map((dpt) => (
                  <option key={dpt.id} value={dpt.id} style={{ background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" }}>{dpt.name}</option>
                ))}
              </select>
            ) : issue.department ? (
              <div className={actionBtn + " border"} style={{ borderColor: t.inputBorder, color: t.text, background: innerBg }}>
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0 text-blue-500" />
                  <span className="truncate">{issue.department.name}</span>
                </span>
                {!locked && (
                  <button onClick={() => setAssigning(true)} disabled={busy || !accepted} className="shrink-0 text-xs font-semibold text-blue-500 disabled:opacity-50">
                    Change
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => setAssigning(true)} disabled={busy || locked || !accepted} className={actionBtn + " text-white"} style={{ background: "#2563EB" }}>
                <span className="flex items-center gap-2"><Route className="w-4 h-4" /> Assign department</span>
              </button>
            )}

            {/* Send the routing request to the selected department. The
                department then accepts or rejects it from its report view. */}
            <button
              onClick={() => handleStatusNote("ASSIGNED", `Routed to ${issue.department?.name ?? "department"}`)}
              disabled={busy || locked || !accepted || !issue.department || currentIndex >= stageOrder.indexOf("ASSIGNED")}
              className={actionBtn + (currentIndex >= stageOrder.indexOf("ASSIGNED") ? " border" : " text-white")}
              style={currentIndex >= stageOrder.indexOf("ASSIGNED")
                ? { borderColor: t.inputBorder, color: t.text, background: innerBg }
                : { background: "#2563EB" }}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {currentIndex >= stageOrder.indexOf("ASSIGNED") ? "Request sent" : "Route to department"}
              </span>
            </button>
          </div>
            </>
          )}
        </div>

        {/* Updates */}
        {issue.timeline && issue.timeline.length > 0 && (
          <div className="rounded-3xl border p-4 md:p-6" style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}>
            <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
              <Bell className="w-4 h-4 text-blue-500" /> Updates
            </div>
            <div className="space-y-3">
              {[...issue.timeline].reverse().map((event) => (
                <div key={event.id} className="rounded-2xl border p-4" style={{ background: timelineBg, borderColor: t.inputBorder }}>
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
        <div className="rounded-3xl border flex flex-wrap p-4 justify-between items-center gap-3" style={{ background: cardBg, borderColor: t.cardBorder, ...blur }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: t.textSub }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tracking active
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => runAction(() => Promise.resolve())}
              disabled={busy}
              className="inline-flex font-semibold rounded-full text-sm px-5 py-2.5 items-center gap-2 border disabled:opacity-60"
              style={{ borderColor: t.inputBorder, color: t.text }}
            >
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> Refresh Status
            </button>
            <button
              onClick={() => {
                const next = stageOrder[currentIndex + 1];
                if (next) handleStatus(next);
              }}
              disabled={busy || locked || !accepted || currentIndex < 0 || currentIndex >= stageOrder.length - 1}
              className="inline-flex font-semibold rounded-full text-sm px-5 py-2.5 items-center gap-2 text-white disabled:opacity-60"
              style={{ background: "#2563EB" }}
            >
              <Send className="w-4 h-4" /> Advance Status
            </button>
          </div>
        </div>
      </div>

      {/* Reject-with-reason modal */}
      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          onClick={() => !generatingReason && setRejectOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border p-5 md:p-6"
            style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(220,38,38,0.12)", color: "#DC2626" }}>
                <X className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-lg" style={{ color: t.text }}>Reject report</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: t.textSub }}>
              Tell the reporter why this report is being rejected. This reason is shown on their tracking page.
            </p>

            <label className="text-xs font-medium" style={{ color: t.textSub }}>Reason for rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              autoFocus
              placeholder="e.g. This report duplicates an existing case, or the location falls outside our service area…"
              className="mt-1.5 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" }}
            />

            <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => setRejectOpen(false)}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ borderColor: t.inputBorder, color: t.text }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateReason}
                  disabled={generatingReason || busy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ borderColor: t.inputBorder, color: "#2563EB", background: isDark ? "rgba(37,99,235,0.10)" : "rgba(37,99,235,0.06)" }}
                >
                  {generatingReason ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generatingReason ? "Generating…" : "Generate with AI"}
                </button>
                <button
                  onClick={submitRejection}
                  disabled={busy || generatingReason || !rejectReason.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ background: "#DC2626" }}
                >
                  <Send className="w-4 h-4" /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Images popup */}
      {showImages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          onClick={() => setShowImages(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border p-4 md:p-6"
            style={{ background: cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...blur, scrollbarWidth: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium text-sm flex items-center gap-2" style={{ color: t.text }}>
                <Images className="w-4 h-4 text-blue-500" /> Issue images
                <span className="text-xs" style={{ color: t.textSub }}>({issue.images?.length ?? 0})</span>
              </div>
              <button
                onClick={() => setShowImages(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: innerBg, color: t.text }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {issue.images && issue.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {issue.images.map((media) => (
                  <a
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block rounded-2xl border overflow-hidden group"
                    style={{ borderColor: t.inputBorder, background: innerBg }}
                  >
                    {media.isVideo ? (
                      <div className="relative">
                        <video src={media.url} className="w-full h-44 object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                          <PlayCircle className="w-10 h-10 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img src={media.url} alt="Issue media" className="w-full h-44 object-cover transition-transform group-hover:scale-105" />
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm" style={{ color: t.textSub }}>
                No images were attached to this report.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
