import { Check, Clock3, Circle } from "lucide-react";
import {
  categoryLabel,
  statusLabel,
  type Issue,
  type IssueStatus,
} from "../../../lib";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

interface ReportStatusCardProps {
  issue: Issue | null;
  loading: boolean;
}

// The forward-progress pipeline (REJECTED is handled separately).
const PIPELINE: { key: IssueStatus; label: string; desc: string }[] = [
  { key: "REPORTED", label: "Submitted", desc: "Report received successfully" },
  { key: "VERIFIED", label: "Verified", desc: "AI and team verification complete" },
  { key: "ASSIGNED", label: "Assigned", desc: "Routed to the responsible department" },
  { key: "ENGINEER_VISITED", label: "Inspected", desc: "Field engineer visited the site" },
  { key: "REPAIR_STARTED", label: "In Progress", desc: "Repair work has started" },
  { key: "COMPLETED", label: "Resolved", desc: "Issue marked as resolved" },
];

export function ReportStatusCard({ issue, loading }: ReportStatusCardProps) {
  const currentIndex = issue
    ? PIPELINE.findIndex((s) => s.key === issue.status)
    : -1;
  const isRejected = issue?.status === "REJECTED";

  return (
    <Card className="shadow-sm rounded-3xl border-border border border-solid p-5 gap-4">
      <CardHeader className="p-0 gap-0">
        <CardTitle className="text-base leading-6">Report Status</CardTitle>
        <CardDescription className="text-sm">Current stage of the selected issue.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 gap-3">
        {!issue ? (
          <div className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            {loading ? "Loading issue…" : "Select a report on the map to see its status."}
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-muted flex px-4 py-3 mb-3 justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm leading-5 truncate">
                  {categoryLabel(issue.category)} · {issue.address ?? "Location on map"}
                </div>
                <div className="text-muted-foreground text-xs leading-4">
                  Submitted {new Date(issue.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <Badge
                className={
                  "font-semibold rounded-full text-[11px] px-2.5 py-1 shrink-0 " +
                  (isRejected
                    ? "bg-red-500 text-white"
                    : "bg-[#2b7fff] text-blue-50")
                }
              >
                {statusLabel(issue.status)}
              </Badge>
            </div>

            {isRejected ? (
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                This report was rejected after review.
              </div>
            ) : (
              <div className="space-y-3">
                {PIPELINE.map((step, i) => {
                  const done = i < currentIndex;
                  const current = i === currentIndex;
                  const Icon = done ? Check : current ? Clock3 : Circle;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div
                        className={
                          "size-8 rounded-full flex justify-center items-center shrink-0 " +
                          (done || current
                            ? "bg-[#2b7fff]/10 text-[#2b7fff]"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm leading-5">
                          {step.label}
                        </div>
                        <div className="text-muted-foreground text-xs leading-4">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
