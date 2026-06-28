import { motion } from "motion/react";
import { Flame } from "lucide-react";
import type { DashboardTheme } from "../theme";
import type { Hotspot } from "../../../lib";

interface HotspotCardProps {
  t: DashboardTheme;
  isDark: boolean;
  hotspots?: Hotspot[];
}

export function HotspotCard({ t, isDark, hotspots }: HotspotCardProps) {
  const top3 = (hotspots ?? []).slice(0, 3);
  if (top3.length === 0) return null;

  const colors = ["#EF4444", "#F59E0B", "#2563EB"];
  const severities = ["Critical", "High", "Medium"];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl p-5 border transition-all"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-base" style={{ color: t.text }}>Most Affected Area</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textSub }}>Based on active report density</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl text-red-500" style={{ background: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2", border: isDark ? "1px solid rgba(239,68,68,0.20)" : "1px solid #FECACA" }}>
          <Flame className="w-3.5 h-3.5" /> Hotspot
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {top3.map((h, i) => {
          const color = colors[i] || "#2563EB";
          const bg = isDark ? `${color}1F` : `${color}10`;
          return (
            <div key={i} className="rounded-2xl p-3 md:p-4 text-center" style={{ background: bg }}>
              <p className="font-bold text-lg leading-none mb-1" style={{ color }}>{h.count}</p>
              <p className="text-xs font-semibold" style={{ color: t.text }}>{`${h.latitude.toFixed(2)}, ${h.longitude.toFixed(2)}`}</p>
              <p className="text-xs mt-0.5 font-semibold" style={{ color }}>{severities[i] || "Medium"}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
