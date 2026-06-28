import { Building2, CheckCircle2, Clock, Route, Send, User as UserIcon } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Department, Issue, IssueStatus } from "../../../../lib";
import { FIELD_INSPECTORS, type DerivedReport, type Surface } from "./reportDetail";

/** The actions card — routing controls for admins, progress controls for departments. */
export function ReportActions({
  t,
  isDark,
  surface,
  issue,
  derived,
  isDepartment,
  busy,
  assigning,
  departmentList,
  onSetAssigning,
  onAssign,
  onStatus,
  onStatusNote,
}: {
  t: DashboardTheme;
  isDark: boolean;
  surface: Surface;
  issue: Issue;
  derived: DerivedReport;
  isDepartment: boolean;
  busy: boolean;
  assigning: boolean;
  departmentList: Department[];
  onSetAssigning: (v: boolean) => void;
  onAssign: (departmentId: string) => void;
  onStatus: (status: IssueStatus) => void;
  onStatusNote: (status: IssueStatus, note: string) => void;
}) {
  const { locked, routed, deptAccepted, inspectorAssigned, inspectorName, workValue, accepted, currentIndex, stageOrder } = derived;
  const { actionBtn } = surface;
  const selectStyle = { background: isDark ? "#18181B" : "#FFFFFF", borderColor: t.inputBorder, color: isDark ? "#E5E7EB" : "#0F172A" };
  const optionStyle = { background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#E5E7EB" : "#0F172A" };
  const placeholderStyle = { background: isDark ? "#18181B" : "#FFFFFF", color: isDark ? "#9CA3AF" : "#64748B" };

  return (
    <div className="rounded-3xl border p-4 md:p-6" style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}>
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
                  <div className="flex items-center justify-between gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: t.inputBorder, color: t.text, background: surface.innerBg }}>
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <UserIcon className="w-4 h-4 text-blue-500" /> {inspectorName ?? "Assigned"}
                    </span>
                    <span className="text-xs" style={{ color: t.textSub }}>Assigned</span>
                  </div>
                ) : (
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onStatusNote("ENGINEER_VISITED", `Field inspector assigned: ${e.target.value}`)}
                    disabled={busy || locked}
                    className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                    style={selectStyle}
                  >
                    <option value="" disabled style={placeholderStyle}>Assign a field inspector…</option>
                    {FIELD_INSPECTORS.map((name) => (
                      <option key={name} value={name} style={optionStyle}>{name}</option>
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
                        onStatusNote(v, note);
                      }}
                      disabled={busy || locked}
                      className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                      style={selectStyle}
                    >
                      <option value="ENGINEER_VISITED" style={optionStyle}>Not started</option>
                      <option value="REPAIR_STARTED" style={optionStyle}>In progress</option>
                      <option value="COMPLETED" style={optionStyle}>Completed</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => onStatusNote("COMPLETED", "Issue resolved")}
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
              onClick={() => onStatus("VERIFIED")}
              disabled={busy || locked || currentIndex < stageOrder.indexOf("ACCEPTED") || currentIndex >= stageOrder.indexOf("VERIFIED")}
              className={actionBtn + " border"}
              style={{ borderColor: t.inputBorder, color: t.text, background: surface.innerBg }}
            >
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark verified</span>
            </button>

            {assigning ? (
              <select
                autoFocus
                defaultValue=""
                onChange={(e) => onAssign(e.target.value)}
                disabled={busy}
                className="rounded-2xl border px-4 py-3 text-sm font-medium outline-none disabled:opacity-50"
                style={selectStyle}
              >
                <option value="" disabled style={placeholderStyle}>Select a department…</option>
                {departmentList.map((dpt) => (
                  <option key={dpt.id} value={dpt.id} style={optionStyle}>{dpt.name}</option>
                ))}
              </select>
            ) : issue.department ? (
              <div className={actionBtn + " border"} style={{ borderColor: t.inputBorder, color: t.text, background: surface.innerBg }}>
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0 text-blue-500" />
                  <span className="truncate">{issue.department.name}</span>
                </span>
                {!locked && (
                  <button onClick={() => onSetAssigning(true)} disabled={busy || !accepted} className="shrink-0 text-xs font-semibold text-blue-500 disabled:opacity-50">
                    Change
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => onSetAssigning(true)} disabled={busy || locked || !accepted} className={actionBtn + " text-white"} style={{ background: "#2563EB" }}>
                <span className="flex items-center gap-2"><Route className="w-4 h-4" /> Assign department</span>
              </button>
            )}

            {/* Send the routing request to the selected department. The
                department then accepts or rejects it from its report view. */}
            <button
              onClick={() => onStatusNote("ASSIGNED", `Routed to ${issue.department?.name ?? "department"}`)}
              disabled={busy || locked || !accepted || !issue.department || currentIndex >= stageOrder.indexOf("ASSIGNED")}
              className={actionBtn + (currentIndex >= stageOrder.indexOf("ASSIGNED") ? " border" : " text-white")}
              style={currentIndex >= stageOrder.indexOf("ASSIGNED")
                ? { borderColor: t.inputBorder, color: t.text, background: surface.innerBg }
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
  );
}
