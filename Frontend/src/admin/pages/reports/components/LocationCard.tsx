import { MapPin } from "lucide-react";
import { LocationMap } from "../../../../pages/report/components/LocationMap";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** Map + reported-location summary card. */
export function LocationCard({
  t,
  isDark,
  surface,
  issue,
  loc,
}: {
  t: DashboardTheme;
  isDark: boolean;
  surface: Surface;
  issue: Issue;
  loc: string;
}) {
  return (
    <div className="rounded-3xl border p-4 md:p-6" style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}>
      <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
        <MapPin className="w-4 h-4 text-blue-500" /> Location
      </div>
      <div className="rounded-2xl border overflow-hidden mb-3" style={{ borderColor: t.inputBorder, height: 200 }}>
        <LocationMap lat={issue.latitude} lng={issue.longitude} isDark={isDark} />
      </div>
      <div className="rounded-2xl p-4 space-y-2" style={{ background: surface.innerBg }}>
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
  );
}
