import { motion, AnimatePresence } from "motion/react";
import { Flame, Filter, MapPin, ZoomIn, ZoomOut, Navigation } from "lucide-react";
import type { DashboardTheme } from "../theme";
import { mapPins } from "../data";

interface LiveIssueMapProps {
  t: DashboardTheme;
  isDark: boolean;
  mapFilter: string;
  setMapFilter: (v: string) => void;
  showHeat: boolean;
  setShowHeat: (v: boolean) => void;
  activePin: string | null;
  setActivePin: (v: string | null) => void;
}

// Interactive city map with filter chips, heatmap toggle and animated pins.
export function LiveIssueMap({
  t, isDark, mapFilter, setMapFilter, showHeat, setShowHeat, activePin, setActivePin,
}: LiveIssueMapProps) {
  const filteredPins = mapFilter === "All" ? mapPins : mapPins.filter(p => p.type === mapFilter);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border overflow-hidden transition-all"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm" style={{ color: t.text }}>Live Issue Map</h3>
          <p className="text-xs" style={{ color: t.textSub }}>{filteredPins.length} issues visible</p>
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
        <div className="absolute inset-0" style={{ background: isDark?"linear-gradient(180deg,#1A2744 0%,#152038 100%)":"linear-gradient(180deg,#E8F0FE 0%,#D4E4F7 100%)" }} />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 200">
          {[40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke={isDark?"rgba(99,130,255,0.25)":"white"} strokeWidth="3" opacity="0.7" />)}
          {[60,120,180,240].map(x => <line key={x} x1={x} y1="0" x2={x} y2="200" stroke={isDark?"rgba(99,130,255,0.25)":"white"} strokeWidth="3" opacity="0.7" />)}
          <line x1="0" y1="200" x2="320" y2="40" stroke={isDark?"rgba(99,130,255,0.20)":"white"} strokeWidth="5" opacity="0.5" />
          {[[10,10,45,25],[70,10,45,25],[130,10,45,25],[10,50,45,25],[70,50,45,25],[130,50,45,25],[10,90,45,25],[70,90,45,25]].map(([x,y,w,h],i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={isDark?"#1E3560":"#BCD0EA"} rx="3" opacity="0.6" />
          ))}
          {showHeat && (
            <>
              <ellipse cx="95" cy="80" rx="45" ry="35" fill="#EF4444" opacity="0.22" />
              <ellipse cx="175" cy="115" rx="30" ry="22" fill="#F59E0B" opacity="0.18" />
              <ellipse cx="230" cy="55" rx="20" ry="16" fill="#EF4444" opacity="0.14" />
            </>
          )}
        </svg>
        {filteredPins.map(({ x, y, color, label, id }, i) => (
          <motion.div key={id} className="absolute cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-100%)" }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 300, damping: 14 }}
            onClick={() => setActivePin(activePin === id ? null : id)}>
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: color, boxShadow: `0 4px 12px ${color}55` }}>
                <MapPin className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              {activePin === id && (
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${color}` }}
                  animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }} />
              )}
            </motion.div>
            <AnimatePresence>
              {activePin === id && (
                <motion.div initial={{ opacity: 0, y: 4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-10 border text-xs font-bold"
                  style={{ background: t.card, borderColor: t.cardBorder, color: t.text }}>
                  {label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {[{ icon: ZoomIn }, { icon: ZoomOut }].map(({ icon: Icon }, i) => (
            <button key={i} className="w-7 h-7 rounded-xl flex items-center justify-center shadow-md border transition-colors"
              style={{ background: t.card, borderColor: t.cardBorder, color: t.textSub }}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded-xl shadow-md border"
          style={{ background: t.card, borderColor: t.cardBorder }}>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-bold" style={{ color: t.text }}>{filteredPins.length} nearby</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Critical", count: 2,  color: "#EF4444", bg: isDark?"rgba(239,68,68,0.12)":"#FEF2F2" },
            { label: "High",     count: 5,  color: "#F59E0B", bg: isDark?"rgba(245,158,11,0.12)":"#FFFBEB" },
            { label: "Resolved", count: 18, color: "#22C55E", bg: isDark?"rgba(34,197,94,0.12)":"#F0FDF4" },
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
