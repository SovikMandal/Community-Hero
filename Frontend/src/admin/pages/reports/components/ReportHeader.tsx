import { ArrowLeft, Search } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Surface } from "./reportDetail";

/** Page heading: back link, title and the tracking-ID badge. */
export function ReportHeader({
  t,
  surface,
  trackingId,
  onBack,
}: {
  t: DashboardTheme;
  surface: Surface;
  trackingId: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <button
          onClick={onBack}
          className="mb-1 inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: t.textSub }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </button>
        <h1 className="font-semibold text-2xl md:text-3xl tracking-tight" style={{ color: t.text }}>Report Details</h1>
      </div>
      <div className="rounded-full flex px-4 py-2 items-center gap-3 border" style={{ background: surface.cardBg, borderColor: t.inputBorder, ...surface.blur }}>
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex justify-center items-center">
          <Search className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs" style={{ color: t.textSub }}>Tracking ID</div>
          <div className="font-medium text-sm" style={{ color: t.text }}>CIV-{trackingId.slice(-8).toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}
