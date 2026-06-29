import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Building2,
  Droplets,
  Trash2,
  Zap,
  TreePine,
  Waves,
  Construction,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { admin, type DepartmentWithStats } from "../../../lib";
import { GridBackground } from "../../../components/GridBackground";

// Maps a department to an icon + accent colour based on its name. Falls back to
// a generic building icon so unknown/custom departments still render nicely.
function deptVisual(name: string): { icon: typeof Building2; accent: string } {
  const n = name.toLowerCase();
  if (n.includes("road")) return { icon: Construction, accent: "#F59E0B" };
  if (n.includes("water")) return { icon: Droplets, accent: "#2563EB" };
  if (n.includes("sanitation") || n.includes("garbage") || n.includes("waste"))
    return { icon: Trash2, accent: "#16A34A" };
  if (n.includes("electric") || n.includes("light")) return { icon: Zap, accent: "#EAB308" };
  if (n.includes("forest") || n.includes("tree")) return { icon: TreePine, accent: "#059669" };
  if (n.includes("drain")) return { icon: Waves, accent: "#0891B2" };
  return { icon: Building2, accent: "#7C3AED" };
}

function StatTile({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof FileText;
}) {
  return (
    <div
      className="rounded-2xl border px-3 py-2.5 transition-colors"
      style={{ borderColor: `${color}26`, background: `${color}0f` }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}24`, color }}
        >
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 text-center text-xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function DepartmentCard({
  dept,
  index,
  onOpen,
}: {
  dept: DepartmentWithStats;
  index: number;
  onOpen: () => void;
}) {
  const { icon: Icon, accent } = deptVisual(dept.name);
  const s = dept.stats;
  const rate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;
  const rateColor = rate >= 70 ? "#16A34A" : rate >= 40 ? "#F59E0B" : "#DC2626";
  // Open issues = still active (everything except resolved and rejected).
  const openIssues = Math.max(s.total - s.resolved - s.rejected, 0);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.06 }}
      onClick={onOpen}
      style={{ ["--dept" as string]: accent }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Decorative glow blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-2xl"
        style={{ background: `${accent}33` }}
      />

      {/* Accent header */}
      <div className="relative p-5" style={{ background: `linear-gradient(135deg, ${accent}1f, transparent 70%)` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-md ring-1"
              style={{
                background: `linear-gradient(145deg, ${accent}, ${accent}cc)`,
                color: "#fff",
                boxShadow: `0 8px 18px -6px ${accent}99`,
                ["--tw-ring-color" as string]: `${accent}55`,
              }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground">{dept.name}</h3>
              <p className="truncate text-xs text-muted-foreground">
                {dept.description || "Civic department"}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: `${accent}1f`, color: accent }}
              title="Open issues"
            >
              <FolderOpen className="h-3 w-3" />
              {openIssues} open
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2 px-5 pt-4">
        <StatTile label="Total" value={s.total} color="#2563EB" icon={FileText} />
        <StatTile label="In Progress" value={s.inProgress} color="#F59E0B" icon={Clock} />
        <StatTile label="Resolved" value={s.resolved} color="#16A34A" icon={CheckCircle2} />
        <StatTile label="Rejected" value={s.rejected} color="#DC2626" icon={XCircle} />
      </div>

      {/* Resolution rate */}
      <div className="px-5 pb-5 pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Resolution rate</span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ background: `${rateColor}1a`, color: rateColor }}
          >
            {rate}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent}, ${rateColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
        </div>
      </div>
    </motion.button>
  );
}

export function AdminDepartments({ isDark }: { isDark?: boolean }) {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    admin
      .departments.list()
      .then((d) => { if (active) setDepartments(d); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="relative min-h-full">
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Departments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Report distribution and resolution performance per department. Open a department to manage its reports.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              Couldn't load departments. Please try again.
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-3xl border border-border bg-card" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
              No departments configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {departments.map((dept, i) => (
                <DepartmentCard
                  key={dept.id}
                  dept={dept}
                  index={i}
                  onOpen={() => navigate(`/admin/departments/${dept.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDepartments;
