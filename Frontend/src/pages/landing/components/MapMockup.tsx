import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Search, Filter, Layers, Navigation } from "lucide-react";

const mapPins = [
  { x: 28, y: 38, color: "#EF4444", label: "Pothole", delay: 0 },
  { x: 55, y: 22, color: "#F59E0B", label: "Broken Light", delay: 0.15 },
  { x: 72, y: 55, color: "#22C55E", label: "Resolved", delay: 0.3 },
  { x: 18, y: 65, color: "#2563EB", label: "Water Leak", delay: 0.45 },
  { x: 62, y: 75, color: "#EF4444", label: "Manhole", delay: 0.6 },
  { x: 42, y: 58, color: "#F59E0B", label: "Garbage", delay: 0.75 },
  { x: 84, y: 32, color: "#22C55E", label: "Fixed", delay: 0.2 },
];

// Animated city-map preview shown in the hero.
export function MapMockup({ isDark = false }: { isDark?: boolean }) {
  const [active, setActive] = useState<number | null>(0);

  const c = isDark
    ? { park: "#14281d", block: "#1e293b", water: "#0c1a2b", major: "#334155", minor: "#1e293b" }
    : { park: "#D7EAD9", block: "#E2E8F0", water: "#BFD8F2", major: "#FFFFFF", minor: "#CBD5E1" };

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl shadow-blue-100/50 dark:shadow-none">
      {/* Map base (self-contained, no external image) */}
      <div className="absolute inset-0" style={{ background: isDark ? "linear-gradient(135deg,#0B1120 0%,#0F172A 50%,#0B1120 100%)" : "linear-gradient(135deg,#E8F0FE 0%,#EEF2F7 50%,#E3ECF7 100%)" }} />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {/* Parks / blocks */}
        <rect x="30" y="40" width="90" height="70" rx="8" fill={c.park} />
        <rect x="250" y="180" width="110" height="80" rx="8" fill={c.park} />
        <rect x="160" y="30" width="70" height="55" rx="6" fill={c.block} />
        <rect x="40" y="180" width="80" height="70" rx="6" fill={c.block} />
        <rect x="280" y="50" width="80" height="60" rx="6" fill={c.block} />
        {/* Water */}
        <path d="M0 250 Q120 220 200 255 T400 245 L400 300 L0 300 Z" fill={c.water} />
        {/* Major roads */}
        <g stroke={c.major} strokeWidth="7" strokeLinecap="round">
          <line x1="0" y1="130" x2="400" y2="120" />
          <line x1="0" y1="200" x2="400" y2="195" />
          <line x1="140" y1="0" x2="150" y2="300" />
          <line x1="300" y1="0" x2="310" y2="300" />
        </g>
        {/* Minor roads */}
        <g stroke={c.minor} strokeWidth="2" strokeLinecap="round">
          <line x1="0" y1="80" x2="400" y2="72" />
          <line x1="0" y1="160" x2="400" y2="155" />
          <line x1="60" y1="0" x2="66" y2="300" />
          <line x1="220" y1="0" x2="228" y2="300" />
        </g>
      </svg>
      {/* Overlay tint */}
      <div className="absolute inset-0 bg-blue-950/5" />

      {/* Map toolbar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur rounded-2xl px-3 py-2 shadow-lg text-xs font-medium text-slate-700 dark:text-slate-200">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Search location...</span>
        </div>
        <div className="flex gap-2">
          {[Filter, Layers, Navigation].map((Icon, i) => (
            <div key={i} className="w-8 h-8 bg-white/95 dark:bg-slate-900/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <Icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Pins */}
      {mapPins.map(({ x, y, color, label, delay }, i) => (
        <motion.div
          key={i}
          className="absolute cursor-pointer"
          style={{ left: `${x}%`, top: `${y}%` }}
          initial={{ y: -20, opacity: 0, scale: 0 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, type: "spring", stiffness: 300, damping: 15 }}
          onClick={() => setActive(active === i ? null : i)}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: color }}
            >
              <MapPin className="w-4 h-4 text-white fill-white" />
            </div>
            {/* Pulse ring */}
            {active === i && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${color}` }}
                animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
          </motion.div>
          {/* Tooltip */}
          <AnimatePresence>
            {active === i && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xl whitespace-nowrap"
              >
                {label}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur rounded-2xl p-3 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            {[
              { color: "#EF4444", label: "Critical" },
              { color: "#F59E0B", label: "Active" },
              { color: "#22C55E", label: "Resolved" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{label}</span>
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">7 issues nearby</span>
        </div>
      </div>
    </div>
  );
}
