// Shared constants, types and derivation helpers for the admin Report Detail
// page. Keeping the lifecycle logic here lets the page and its presentational
// components stay small and focused.
import { statusLabel, type Issue, type IssueStatus } from "../../../../lib";

/** Ordered lifecycle stages an issue passes through (mirrors the track page). */
export const STATUS_STAGES: { status: IssueStatus; label: string; defaultDesc: string }[] = [
  { status: "REPORTED",         label: "Report submitted", defaultDesc: "The issue was received and assigned a tracking ID." },
  { status: "ACCEPTED",         label: "Accepted",         defaultDesc: "The report was accepted for review by an administrator." },
  { status: "VERIFIED",         label: "Verified",         defaultDesc: "The issue has been verified by the community or staff." },
  { status: "ASSIGNED",         label: "Assigned",         defaultDesc: "Department notified and case queued." },
  { status: "ENGINEER_VISITED", label: "Field inspection", defaultDesc: "An officer has visited the site." },
  { status: "REPAIR_STARTED",   label: "Repair started",   defaultDesc: "Work is in progress." },
  { status: "COMPLETED",        label: "Completed",        defaultDesc: "Issue resolved." },
];

// Hardcoded field inspectors a department can assign to a report.
export const FIELD_INSPECTORS = [
  "Rajesh Kumar",
  "Anita Sharma",
  "Vikram Singh",
  "Priya Menon",
  "Arjun Reddy",
];

/**
 * A single rendered timeline step. `state` drives its appearance:
 *   • "done"    — a stage fully behind the active one (green ✓).
 *   • "current" — the stage the report is actively sitting on (in progress).
 *                 The terminal COMPLETED stage is shown as "done", not current.
 *   • "pending" — a stage not yet reached.
 */
export interface TimelineStep {
  label: string;
  desc: string;
  timestamp: string | null;
  state: "done" | "current" | "pending";
  done: boolean;
}

/** Translucent "glass" surface colours derived from the dark/light mode. */
export interface Surface {
  innerBg: string;
  timelineBg: string;
  cardBg: string;
  blur: { backdropFilter: string; WebkitBackdropFilter: string };
  actionBtn: string;
}

export function surfaces(isDark: boolean): Surface {
  return {
    innerBg: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)",
    timelineBg: isDark ? "rgba(255,255,255,0.02)" : "rgba(244,244,245,0.3)",
    // Translucent card background so the grid background shows through.
    cardBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)",
    blur: { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" },
    actionBtn:
      "inline-flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50",
  };
}

/** Everything derived from an issue's status + timeline, in one place. */
export interface DerivedReport {
  loc: string;
  issueStatusLabel: string;
  priorityColor: string;
  statusColor: string;
  isRejected: boolean;
  stageOrder: IssueStatus[];
  currentIndex: number;
  timelineSteps: TimelineStep[];
  currentStage: string;
  locked: boolean;
  accepted: boolean;
  routed: boolean;
  inspectorAssigned: boolean;
  deptAccepted: boolean;
  inspectorName: string | null;
  workValue: IssueStatus;
}

export function deriveReport(issue: Issue, deptAcceptedLocal: boolean): DerivedReport {
  const loc = issue.address ?? `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`;
  const issueStatusLabel = statusLabel(issue.status);
  const priorityColor =
    issue.priority === "CRITICAL" ? "#DC2626" : issue.priority === "HIGH" ? "#D97706" : "#2563EB";
  const statusColor =
    issue.status === "COMPLETED" ? "#16A34A" : issue.status === "REJECTED" ? "#DC2626" : "#D97706";

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

  const timelineSteps: TimelineStep[] = STATUS_STAGES.map((stage, i) => {
    const realEvent = timelineByStatus.get(stage.status);
    const state: TimelineStep["state"] =
      i < currentIndex
        ? "done"
        : i === currentIndex
          ? stage.status === "COMPLETED" ? "done" : "current"
          : "pending";
    return {
      label:
        stage.status === "ASSIGNED" && issue.department?.name
          ? `Routed to ${issue.department.name}`
          : stage.label,
      desc: realEvent?.note ?? stage.defaultDesc,
      timestamp: realEvent?.createdAt ?? null,
      state,
      done: state === "done",
    };
  });
  if (isRejected) {
    const rejectedEvent = timelineByStatus.get("REJECTED");
    timelineSteps.push({
      label: "Rejected",
      desc: rejectedEvent?.note ?? "This issue was rejected.",
      timestamp: rejectedEvent?.createdAt ?? null,
      state: "done",
      done: true,
    });
  }

  // The "current stage" headline tracks the active (or terminal) step.
  const currentStage = isRejected
    ? "Rejected"
    : timelineSteps[currentIndex]?.label ?? statusLabel(issue.status);

  // Once completed OR rejected, the report is terminal — actions are locked.
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
    issue.status === "COMPLETED"
      ? "COMPLETED"
      : issue.status === "REPAIR_STARTED"
        ? "REPAIR_STARTED"
        : "ENGINEER_VISITED";

  return {
    loc,
    issueStatusLabel,
    priorityColor,
    statusColor,
    isRejected,
    stageOrder,
    currentIndex,
    timelineSteps,
    currentStage,
    locked,
    accepted,
    routed,
    inspectorAssigned,
    deptAccepted,
    inspectorName,
    workValue,
  };
}
