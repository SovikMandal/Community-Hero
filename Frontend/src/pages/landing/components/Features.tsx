import { motion } from "motion/react";
import { Camera, Map, Users, Zap, BarChart3, Trophy, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "AI Image Detection",
    desc: "Upload a photo and our model instantly classifies the issue, estimates severity, and flags duplicates before submission.",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: Map,
    title: "Smart Map",
    desc: "Every report is pinned on a live heatmap. Hotspots surface automatically to help authorities prioritize dense clusters.",
    color: "#22C55E",
    bg: "#F0FDF4",
  },
  {
    icon: Users,
    title: "Community Verification",
    desc: "Neighbors upvote and corroborate reports. AI weighs consensus to elevate genuine issues and suppress noise.",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    desc: "Follow every state change — Reported → Verified → Assigned → Resolved — with push notifications at each step.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Dashboards for city officials show resolution times, recurrence patterns, and department-level performance.",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    icon: Trophy,
    title: "Rewards & Leaderboard",
    desc: "Earn civic points for reporting, verifying, and following up. Leaderboards recognise the most active heroes.",
    color: "#F59E0B",
    bg: "#FFFBEB",
  },
];

// Six-card grid describing the platform capabilities.
export function Features() {
  return (
    <section id="features" className="py-28 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25 rounded-2xl mb-6">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide">Platform Capabilities</span>
          </div>
          <h2
            className="text-slate-900 dark:text-slate-100 font-bold mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "Inter, sans-serif" }}
          >
            Everything your city needs
            <br />
            <span className="text-blue-600 dark:text-blue-400">to fix itself</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Six intelligent tools working together — from the moment a citizen spots an issue to the day it gets resolved.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white/60 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-white/40 dark:border-white/10 hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-none transition-shadow cursor-default group"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: bg }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                {title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">{desc}</p>
              <div className="flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
                Learn more <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
