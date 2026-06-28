import { motion } from "motion/react";
import { Flame, Filter } from "lucide-react";
import type { DashboardTheme } from "../theme";
import type { MapMarker } from "../../../lib";
import { DashboardGoogleMap } from "./DashboardGoogleMap";
import type { StatusCounts } from "./IssuePipeline";

interface LiveMapCardProps {
  t: DashboardTheme;
  isDark: boolean;
  mapMarkers: MapMarker[];
  mapFilter: string;
  setMapFilter: (v: string) => void;
  showHeat: boolean;
  setShowHeat: (v: boolean) => void;
  activePin: string | null;
  setActivePin: (v: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  statusCounts: StatusCounts;
}

// Card wrapper around the Google map: filter chips, heat toggle and a legend.
export function LiveMapCard({
  t, isDark, mapMarkers, mapFilter, setMapFilter, showHeat, setShowHeat,
  activePin, setActivePin, userLocation, statusCounts,
}: LiveMapCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border overflow-hidden transition-all"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm" style={{ color: t.text }}>Live Issue Map</h3>
          <p className="text-xs" style={{ color: t.textSub }}>{mapMarkers.length} issues visible</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowHeat(!showHeat)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: showHeat?(isDark?"rgba(239,68,68,0.12)":"#FEF2F2"):t.tagBg, color: showHeat?"#EF4444":t.textSub, border: `1px solid ${showHeat?(isDark?"rgba(239,68,68,0.25)":"#FCA5A5"):t.inputBorder}` }}>
            <Flame className="w-3 h-3" /> Heat
          </button>
          <button className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: t.tagBg, border: `1px solid ${t.inputBorder}`, color: t.textSub }}>
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
        {["All","Critical","High","Resolved"].map(f => (
          <button key={f} onClick={() => setMapFilter(f)}
            className="px-3 py-1 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
            style={{ background: mapFilter===f?"#2563EB":t.tagBg, color: mapFilter===f?"white":t.textSub, border: `1px solid ${mapFilter===f?"#2563EB":t.inputBorder}` }}>
            {f}
          </button>
        ))}
      </div>
      <div className="relative mx-4 mb-3 rounded-2xl overflow-hidden" style={{ height: 200 }}>
        <DashboardGoogleMap markers={mapMarkers} activePin={activePin} setActivePin={setActivePin} userLocation={userLocation} showHeat={showHeat} isDark={isDark} />
      </div>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Critical", count: statusCounts.critical,  color: "#EF4444", bg: isDark?"rgba(239,68,68,0.12)":"#FEF2F2" },
            { label: "High",     count: statusCounts.high,       color: "#F59E0B", bg: isDark?"rgba(245,158,11,0.12)":"#FFFBEB" },
            { label: "Resolved", count: statusCounts.completed,  color: "#22C55E", bg: isDark?"rgba(34,197,94,0.12)":"#F0FDF4" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="rounded-2xl p-2.5 text-center" style={{ background: bg }}>
              <p className="font-bold text-base leading-none mb-0.5" style={{ color }}>{count}</p>
              <p className="text-xs" style={{ color: t.textSub }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
