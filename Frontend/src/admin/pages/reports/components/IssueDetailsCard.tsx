import { FileText, Images } from "lucide-react";
import { categoryLabel } from "../../../../lib";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** Issue category / AI summary / upvotes / reporter, with a "View images" button. */
export function IssueDetailsCard({
  t,
  surface,
  issue,
  onViewImages,
}: {
  t: DashboardTheme;
  surface: Surface;
  issue: Issue;
  onViewImages: () => void;
}) {
  return (
    <div className="rounded-3xl border p-4 md:p-6" style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium text-sm flex items-center gap-2" style={{ color: t.text }}>
          <FileText className="w-4 h-4 text-blue-500" /> Issue details
        </div>
        <button
          onClick={onViewImages}
          disabled={!issue.images || issue.images.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
          style={{ borderColor: t.inputBorder, color: t.text, background: surface.innerBg }}
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
        <div className="rounded-2xl p-4" style={{ background: surface.innerBg }}>
          <div className="text-xs" style={{ color: t.textSub }}>Category</div>
          <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{categoryLabel(issue.category)}</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: surface.innerBg }}>
          <div className="text-xs" style={{ color: t.textSub }}>AI Summary</div>
          <div className="text-sm mt-1" style={{ color: t.textSub }}>{issue.aiSummary ?? issue.description}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ background: surface.innerBg }}>
            <div className="text-xs" style={{ color: t.textSub }}>Upvotes</div>
            <div className="font-medium text-sm mt-1" style={{ color: t.text }}>{issue._count?.votes ?? 0}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: surface.innerBg }}>
            <div className="text-xs" style={{ color: t.textSub }}>Reported by</div>
            <div className="font-medium text-sm mt-1 truncate" style={{ color: t.text }}>{issue.reporter?.name ?? "Citizen Anonymous"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
