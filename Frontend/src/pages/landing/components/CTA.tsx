import { motion } from "motion/react";
import { Bell, Plus, Map } from "lucide-react";

// Closing call-to-action banner.
export function CTA({ isDark = false }: { isDark?: boolean }) {
  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-16 text-center"
          style={
            isDark
              ? { background: "transparent", border: "1px solid rgba(255,255,255,0.18)" }
              : { background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)" }
          }
        >
          {/* Decorative glassy circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 dark:bg-white/[0.06] backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 dark:bg-white/[0.06] backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute top-8 left-10 w-32 h-32 rounded-full bg-white/5 dark:bg-white/[0.05] backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute bottom-10 right-16 w-24 h-24 rounded-full bg-white/5 dark:bg-white/[0.05] backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-white/5 dark:bg-white/[0.05] backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute top-12 right-1/4 w-10 h-10 rounded-full bg-white/5 dark:bg-white/[0.05] backdrop-blur-sm border border-white/10 pointer-events-none" />
          {/* Colored glassy accent circles */}
          <div className="absolute top-6 left-1/3 w-28 h-28 rounded-full bg-red-500/10 backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute bottom-6 left-1/4 w-20 h-20 rounded-full bg-blue-500/15 backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute top-1/3 right-12 w-24 h-24 rounded-full bg-purple-500/10 backdrop-blur-sm border border-white/10 pointer-events-none" />
          <div className="absolute bottom-12 right-1/3 w-14 h-14 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-white/10 pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-2xl mb-8">
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold">Join 8,400+ Active Citizens</span>
            </div>
            <h2
              className="text-white font-bold mb-5"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontFamily: "Inter, sans-serif" }}
            >
              Your city needs you.
              <br />
              Be a Community Hero.
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
              Every issue you report is one step toward a safer, cleaner community. Start making a difference today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Report Your First Issue
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold border border-white/20 rounded-2xl hover:bg-white/20 transition-colors"
              >
                <Map className="w-4 h-4" />
                Browse Active Issues
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
