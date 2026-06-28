import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronRight, ArrowRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "../utils";

const issues = [
  {
    id: "CIV-4821",
    title: "Broken Streetlight",
    location: "MG Road, Sector 12",
    status: "Resolved",
    priority: "Medium",
    time: "2h ago",
    upvotes: 34,
    category: "Infrastructure",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "CIV-4820",
    title: "Garbage Overflow",
    location: "Park Street, Block C",
    status: "In Progress",
    priority: "High",
    time: "5h ago",
    upvotes: 71,
    category: "Sanitation",
    img: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "CIV-4819",
    title: "Water Leakage",
    location: "Andheri West, Lane 4",
    status: "High Priority",
    priority: "Critical",
    time: "8h ago",
    upvotes: 112,
    category: "Utilities",
    img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "CIV-4818",
    title: "Open Manhole",
    location: "Karol Bagh, Main Market",
    status: "In Progress",
    priority: "Critical",
    time: "12h ago",
    upvotes: 89,
    category: "Safety",
    img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: "CIV-4817",
    title: "Deep Pothole",
    location: "NH-48, Km marker 142",
    status: "Resolved",
    priority: "High",
    time: "1d ago",
    upvotes: 203,
    category: "Roads",
    img: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=80&h=80&fit=crop&auto=format",
  },
];

const statusStyles: Record<string, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  Resolved: { color: "#16A34A", bg: "#DCFCE7", icon: CheckCircle2, label: "Resolved" },
  "In Progress": { color: "#2563EB", bg: "#DBEAFE", icon: Clock, label: "In Progress" },
  "High Priority": { color: "#EA580C", bg: "#FFEDD5", icon: AlertTriangle, label: "High Priority" },
};

// Filterable live feed of the most recent reports.
export function RecentIssues() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Critical", "In Progress", "Resolved"];
  const filtered = filter === "All" ? issues : issues.filter((i) =>
    filter === "Critical" ? i.priority === "Critical" :
    filter === "In Progress" ? i.status === "In Progress" :
    i.status === "Resolved"
  );

  return (
    <section id="community" className="py-28 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25 rounded-2xl mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">Live Feed</span>
            </div>
            <h2
              className="text-slate-900 dark:text-slate-100 font-bold"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontFamily: "Inter, sans-serif" }}
            >
              Community
            </h2>
          </motion.div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-2xl transition-all",
                  filter === f
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/15 hover:border-blue-200 hover:text-blue-600"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(({ id, title, location, status, priority, time, upvotes, category, img }, i) => {
              const s = statusStyles[status] ?? statusStyles["In Progress"];
              const StatusIcon = s.icon;
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  className="bg-white/60 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl p-5 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/10">
                      <img src={img} alt={title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{id}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">
                          {category}
                        </span>
                        {priority === "Critical" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-slate-900 dark:text-slate-100 font-semibold truncate">{title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ color: s.color, background: s.bg }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-slate-400 dark:text-slate-500 text-xs">{time}</p>
                        <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold mt-0.5">▲ {upvotes}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-slate-400 dark:text-slate-500"
            >
              No issues matching this filter.
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors">
            View all 14,289 issues
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
