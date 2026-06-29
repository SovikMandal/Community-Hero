import { useState, useEffect } from "react";
import { MapPin, Search, ArrowLeft, FileText, GitMerge } from "lucide-react";
import { issues as issuesApi, statusToUiKey, timeAgo, type Issue } from "../../../lib";
import { statusMap } from "../data";
import type { DashboardTheme } from "../theme";
import { AllIssuesSkeleton } from "../../PageSkeletons";

interface AllIssuesViewProps {
  isDark: boolean;
  t: DashboardTheme;
  onBack: () => void;
  onSelect: (id: string) => void;
}

export function AllIssuesView({ isDark, t, onBack, onSelect }: AllIssuesViewProps) {
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    issuesApi.list({ mine: true, limit: 50 }).then((r) => setAllIssues(r.items)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{ scrollbarWidth: "none" }}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <p className="text-sm" style={{ color: t.textSub }}>Your submitted community issues</p>
          <h1 className="font-semibold text-2xl md:text-3xl tracking-tight mt-1" style={{ color: t.text }}>All Reports</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={onBack} className="rounded-full font-semibold text-sm px-5 py-2.5 text-white flex-shrink-0 order-1 sm:order-2"
            style={{ background: "#2563EB" }}>
            <ArrowLeft className="w-4 h-4 inline mr-1" />Back
          </button>
          <div className="rounded-full flex px-4 py-2 items-center gap-2 border flex-1 sm:flex-none order-2 sm:order-1"
            style={{ background: t.card, borderColor: t.inputBorder }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
            <span className="text-sm" style={{ color: t.textMuted }}>Search reports</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border p-4 md:p-6" style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
        {loading ? (
          <AllIssuesSkeleton />
        ) : allIssues.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: t.textSub }}>No reports found.</div>
        ) : allIssues.map((issue, i) => {
          const s = statusMap[statusToUiKey(issue.status)] ?? statusMap["Processing"];
          const StatusIcon = s.icon;
          const img = issue.images?.[0]?.url;
          const loc = issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`;
          return (
            <div key={issue.id}
              onClick={() => onSelect(issue.id)}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-900"
              style={{ borderBottom: i < allIssues.length - 1 ? `1px solid ${t.divider}` : "none" }}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: t.tagBg }}>
                  {img
                    ? <img src={img} alt={issue.title} className="w-full h-full object-cover" />
                    : <MapPin className="w-5 h-5" style={{ color: t.textMuted }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-base" style={{ color: t.text }}>{issue.title}</div>
                  <div className="flex mt-1 items-center gap-2 text-sm" style={{ color: t.textSub }}>
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{loc}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap sm:flex-shrink-0 pl-[4.5rem] sm:pl-0">
                {issue.myReportType && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: issue.myReportType === "merged" ? "rgba(217,119,6,0.12)" : "rgba(37,99,235,0.12)",
                      color: issue.myReportType === "merged" ? "#D97706" : "#2563EB",
                    }}
                  >
                    {issue.myReportType === "merged" ? <GitMerge className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {issue.myReportType}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ color: s.color, background: isDark ? s.bgDark : s.bg }}>
                  <StatusIcon className="w-3.5 h-3.5" />{s.label}
                </div>
                <div className="text-right text-sm" style={{ color: t.textSub }}>
                  <div>{timeAgo(issue.createdAt)}</div>
                  <div className="flex mt-1 justify-end items-center gap-1 font-semibold" style={{ color: t.text }}>
                    ▲ {issue._count?.votes ?? 0}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
