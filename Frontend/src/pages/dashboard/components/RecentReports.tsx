import { motion } from "motion/react";
import { MapPin, ChevronRight } from "lucide-react";
import type { DashboardTheme } from "../theme";
import { statusMap } from "../data";
import { statusToUiKey, timeAgo, type Issue } from "../../../lib";

interface RecentReportsProps {
  t: DashboardTheme;
  isDark: boolean;
  issueList: Issue[];
  dataError: string | null;
  onViewAll: () => void;
  onSelect: (id: string) => void;
}

// List of the citizen's most recent submitted issues.
export function RecentReports({ t, isDark, issueList, dataError, onViewAll, onSelect }: RecentReportsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
      whileHover={{ y: -2 }}
      className="rounded-3xl border transition-all overflow-hidden"
      style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)", borderColor: t.cardBorder, boxShadow: t.cardShadow, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-between px-5 md:px-6 py-5" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div>
          <h2 className="font-bold text-base" style={{ color: t.text }}>Recent Reports</h2>
          <p className="text-xs mt-0.5" style={{ color: t.textSub }}>Your submitted community issues</p>
        </div>
        <button onClick={onViewAll} className="text-blue-500 text-xs font-semibold flex items-center gap-1 hover:text-blue-400 transition-colors">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {issueList.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm" style={{ color: t.textSub }}>
          {dataError ?? "No reports yet. Use “Report Issue” to submit the first one."}
        </div>
      ) : issueList.slice(0, 5).map((issue, i) => {
        const s = statusMap[statusToUiKey(issue.status)] ?? statusMap["Processing"];
        const StatusIcon = s.icon;
        const img = issue.images?.[0]?.url;
        const location = issue.address ?? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`;
        return (
          <motion.div key={issue.id}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.56 + i * 0.07 }}
            whileHover={{ backgroundColor: t.rowHover, x: 2 }}
            onClick={() => onSelect(issue.id)}
            className="flex items-center gap-3 md:gap-4 px-5 md:px-6 py-4 cursor-pointer transition-all"
            style={{ borderBottom: i < issueList.length - 1 ? `1px solid ${t.divider}` : "none" }}>
            <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: t.tagBg }}>
              {img
                ? <img src={img} alt={issue.title} className="w-full h-full object-cover" />
                : <MapPin className="w-4 h-4" style={{ color: t.textMuted }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate mb-0.5" style={{ color: t.text }}>{issue.title}</p>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: t.textMuted }} />
                <p className="text-xs truncate" style={{ color: t.textSub }}>{location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold"
                style={{ color: s.color, background: isDark ? s.bgDark : s.bg }}>
                <StatusIcon className="w-3 h-3" />{s.label}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs" style={{ color: t.textSub }}>{timeAgo(issue.createdAt)}</p>
                <p className="text-xs font-semibold" style={{ color: t.text }}>▲ {issue.citizenCount ?? 0}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
