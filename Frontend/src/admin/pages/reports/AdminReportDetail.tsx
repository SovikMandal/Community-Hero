import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  admin,
  departments as departmentsApi,
  type Department,
  type Issue,
  type IssueContributor,
  type IssueStatus,
} from "../../../lib";
import { tk } from "../../../pages/dashboard/theme";
import { GridBackground } from "../../../components/GridBackground";
import {
  deriveReport,
  surfaces,
  ReportHeader,
  StatusCard,
  LocationCard,
  IssueDetailsCard,
  ReportActions,
  UpdatesList,
  ReportFooter,
  RejectModal,
  ImagesModal,
} from "./components";

export function AdminReportDetail({ isDark = true, mode = "admin" }: { isDark?: boolean; mode?: "admin" | "department" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = tk(isDark);
  const surface = surfaces(isDark);
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
    if (!id) return;
    let active = true;
    admin.issues
      .contributors(id)
      .then((c) => { if (active) setContributors(c); })
      .catch(() => { if (active) setContributors([]); });
    return () => { active = false; };
  }, [id]);

  const runAction = useCallback(
    (action: () => Promise<unknown>, successMsg?: { msg: string; type: "success" | "info" | "warning" | "error" }) => {
      setBusy(true);
      return Promise.resolve(action())
        .then(() => loadIssue())
        .then(() => {
          if (successMsg) toast[successMsg.type](successMsg.msg);
        })
        .catch(() => {
          setError("Action failed. Please try again.");
          toast.error("Action failed. Please try again.");
        })
        .finally(() => setBusy(false));
    },
    [loadIssue],
  );

  const STATUS_TOAST: Record<string, { msg: string; type: "success" | "info" | "warning" | "error" }> = {
    ACCEPTED: { msg: "Report accepted successfully", type: "success" },
    VERIFIED: { msg: "Report marked as verified", type: "info" },
    ASSIGNED: { msg: "Report routed to department", type: "info" },
    ENGINEER_VISITED: { msg: "Field inspector assigned", type: "info" },
    REPAIR_STARTED: { msg: "Repair work started", type: "warning" },
    COMPLETED: { msg: "Issue resolved successfully!", type: "success" },
    REJECTED: { msg: "Report rejected", type: "error" },
  };

  const handleStatus = (status: IssueStatus) => {
    if (!id) return;
    runAction(() => admin.issues.updateStatus(id, status), STATUS_TOAST[status]);
  };

  const handleStatusNote = (status: IssueStatus, note: string) => {
    if (!id) return;
    runAction(() => admin.issues.updateStatus(id, status, note), STATUS_TOAST[status]);
  };

  const handleAssign = (departmentId: string) => {
    if (!id || !departmentId) return;
    setAssigning(false);
    runAction(() => admin.issues.assign(id, departmentId), { msg: "Department assigned successfully", type: "info" });
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
    runAction(() => admin.issues.updateStatus(id, "REJECTED", note), STATUS_TOAST["REJECTED"]);
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

  const derived = deriveReport(issue, deptAcceptedLocal);
  const { currentIndex, stageOrder, locked, accepted } = derived;
  const canAdvance = !(busy || locked || !accepted || currentIndex < 0 || currentIndex >= stageOrder.length - 1);

  const handleAdvance = () => {
    const next = stageOrder[currentIndex + 1];
    if (next) handleStatus(next);
  };

  return (
    <div className="relative flex-1 overflow-y-auto px-4 md:px-8 py-6" style={{ scrollbarWidth: "none" }}>
      <GridBackground isDark={isDark} />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 lg:max-w-6xl xl:max-w-7xl">
        <ReportHeader t={t} surface={surface} trackingId={issue.id} onBack={() => navigate(-1)} />

        <StatusCard
          t={t}
          isDark={isDark}
          surface={surface}
          issue={issue}
          derived={derived}
          isDepartment={isDepartment}
          busy={busy}
          contributors={contributors}
          onAccept={() => {
            if (isDepartment) {
              setDeptAcceptedLocal(true);
              toast.success("Report accepted by department");
            } else {
              handleStatus("ACCEPTED");
            }
          }}
          onReject={openRejectModal}
        />

        {/* Location + Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LocationCard t={t} isDark={isDark} surface={surface} issue={issue} loc={derived.loc} />
          <IssueDetailsCard t={t} surface={surface} issue={issue} onViewImages={() => setShowImages(true)} />
        </div>

        <ReportActions
          t={t}
          isDark={isDark}
          surface={surface}
          issue={issue}
          derived={derived}
          isDepartment={isDepartment}
          busy={busy}
          assigning={assigning}
          departmentList={departmentList}
          onSetAssigning={setAssigning}
          onAssign={handleAssign}
          onStatus={handleStatus}
          onStatusNote={handleStatusNote}
        />

        {issue.timeline && issue.timeline.length > 0 && (
          <UpdatesList t={t} surface={surface} timeline={issue.timeline} />
        )}

        <ReportFooter
          t={t}
          surface={surface}
          busy={busy}
          canAdvance={canAdvance}
          onRefresh={() => runAction(() => Promise.resolve())}
          onAdvance={handleAdvance}
        />
      </div>

      {rejectOpen && (
        <RejectModal
          t={t}
          isDark={isDark}
          surface={surface}
          reason={rejectReason}
          busy={busy}
          generating={generatingReason}
          onReasonChange={setRejectReason}
          onGenerate={handleGenerateReason}
          onClose={() => setRejectOpen(false)}
          onSubmit={submitRejection}
        />
      )}

      {showImages && (
        <ImagesModal t={t} surface={surface} issue={issue} onClose={() => setShowImages(false)} />
      )}
    </div>
  );
}
