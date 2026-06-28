import { motion, AnimatePresence } from "motion/react";
import { Search, Bell, Plus, Sun, Moon, Menu } from "lucide-react";
import type { DashboardTheme } from "../theme";

interface DashboardHeaderProps {
  t: DashboardTheme;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenMobileSidebar: () => void;
  onReportIssue: () => void;
}

// Top app bar: search, dark-mode toggle, notifications and the report CTA.
export function DashboardHeader({ t, isDark, onToggleDark, onOpenMobileSidebar, onReportIssue }: DashboardHeaderProps) {
  return (
    <motion.header initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex items-center justify-between px-4 md:px-8 py-4 flex-shrink-0 transition-colors duration-300 backdrop-blur-xl"
      style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, boxShadow: isDark ? "0 1px 12px rgba(0,0,0,0.25)" : "0 1px 12px rgba(15,23,42,0.04)" }}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button onClick={onOpenMobileSidebar}
          className="lg:hidden w-9 h-9 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ background: t.tagBg, color: t.textSub }}>
          <Menu className="w-4 h-4" />
        </button>
        <div className="hidden sm:flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors"
          style={{ background: isDark ? "rgba(255,255,255,0.05)" : t.inputBg, border: `1px solid ${t.inputBorder}`, width: 260 }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
          <input placeholder="Search issues..." className="bg-transparent text-sm outline-none w-full"
            style={{ color: t.text, fontFamily: "Inter, sans-serif" }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
          onClick={onToggleDark}
          className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: isDark ? "rgba(250,204,21,0.12)" : "#FFFBEB", border: `1px solid ${isDark ? "rgba(250,204,21,0.20)" : "#FEF3C7"}` }}>
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun className="w-4 h-4 text-amber-400" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon className="w-4 h-4 text-slate-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: t.tagBg, border: `1px solid ${t.inputBorder}`, color: t.textSub }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </motion.button>

        <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={onReportIssue}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "#2563EB", boxShadow: "0 4px 12px rgba(37,99,235,0.30)" }}>
          <Plus className="w-4 h-4" /> Report Issue
        </motion.button>

        {/* Mobile report button (icon only) */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onReportIssue}
          className="sm:hidden w-9 h-9 rounded-2xl flex items-center justify-center text-white"
          style={{ background: "#2563EB", boxShadow: "0 4px 12px rgba(37,99,235,0.30)" }}>
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.header>
  );
}
