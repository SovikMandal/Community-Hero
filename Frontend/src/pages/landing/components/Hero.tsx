import { motion } from "motion/react";
import { Plus, ArrowRight, Map, Star } from "lucide-react";
import { MapMockup } from "./MapMockup";

// Landing hero: headline, CTAs, social proof and the animated map mockup.
export function Hero({ onAuthClick, isDark }: { onAuthClick: () => void; isDark?: boolean }) {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-100 dark:bg-indigo-500/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25 rounded-2xl mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-600 text-xs font-semibold tracking-wide">
              AI-Powered Civic Intelligence Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-900 dark:text-slate-100 font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2.6rem, 5.5vw, 4rem)", fontFamily: "Inter, sans-serif" }}
          >
            Community Hero
            <br />
            <span className="text-blue-600">for Every City</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-10 max-w-lg"
          >
            Report. Verify. Resolve. Making every citizen a community hero — AI detects issues, validates reports, and routes them to the right authorities instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAuthClick}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Report Issue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-2xl font-semibold text-sm border border-slate-200 dark:border-white/15 shadow-sm hover:border-blue-200 hover:text-blue-600 transition-all"
            >
              <Map className="w-4 h-4" />
              Explore Map
            </motion.button>
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-2">
              {["https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop",
              ].map((src, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                  <img src={src} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trusted by <strong className="text-slate-800 dark:text-slate-200">8,400+</strong> citizens</p>
            </div>
          </motion.div>
        </div>

        {/* Map mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-[500px] lg:h-[560px]"
        >
          <MapMockup isDark={isDark} />
        </motion.div>
      </div>
    </section>
  );
}
