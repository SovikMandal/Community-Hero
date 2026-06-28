import { motion } from "motion/react";
import { TrendingUp, CheckCircle2, Zap, Users } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const stats = [
  { value: 14289, suffix: "", label: "Issues Reported", icon: TrendingUp, color: "#2563EB", bg: "#EFF6FF" },
  { value: 11021, suffix: "", label: "Issues Resolved", icon: CheckCircle2, color: "#22C55E", bg: "#F0FDF4" },
  { value: 97, suffix: "%", label: "AI Accuracy", icon: Zap, color: "#F59E0B", bg: "#FFFBEB" },
  { value: 8400, suffix: "+", label: "Active Citizens", icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
];

// Animated headline metrics band.
export function Stats() {
  return (
    <section id="analytics" className="py-20 bg-white dark:bg-transparent scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, suffix, label, icon: Icon, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/60 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-white/10 shadow-sm text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div
                className="font-bold mb-1.5"
                style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color, fontFamily: "Inter, sans-serif", lineHeight: 1 }}
              >
                <AnimatedCounter target={value} suffix={suffix} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
