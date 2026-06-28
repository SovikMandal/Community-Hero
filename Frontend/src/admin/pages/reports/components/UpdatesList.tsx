import { Bell } from "lucide-react";
import { statusLabel, timeAgo } from "../../../../lib";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** Reverse-chronological list of timeline events with their notes. */
export function UpdatesList({
  t,
  surface,
  timeline,
}: {
  t: DashboardTheme;
  surface: Surface;
  timeline: NonNullable<Issue["timeline"]>;
}) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="rounded-3xl border p-4 md:p-6" style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur }}>
      <div className="font-medium text-sm flex items-center gap-2 mb-4" style={{ color: t.text }}>
        <Bell className="w-4 h-4 text-blue-500" /> Updates
      </div>
      <div className="space-y-3">
        {[...timeline].reverse().map((event) => (
          <div key={event.id} className="rounded-2xl border p-4" style={{ background: surface.timelineBg, borderColor: t.inputBorder }}>
            <div className="flex justify-between items-center">
              <div className="font-medium text-sm" style={{ color: t.text }}>{statusLabel(event.status)}</div>
              <div className="text-xs" style={{ color: t.textSub }}>{timeAgo(event.createdAt)}</div>
            </div>
            {event.note && <p className="text-sm mt-2" style={{ color: t.textSub }}>{event.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
