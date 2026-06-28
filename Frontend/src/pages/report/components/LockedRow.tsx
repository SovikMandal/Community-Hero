import { Lock, Edit2 } from "lucide-react";
import { tk } from "../theme";

// A read-only ("AI locked") field row with an optional "Change" override button.
export function LockedRow({
  label, value, valueColor, valueBg, icon: Icon,
  onEdit, isDark,
}: {
  label: string; value: string; valueColor?: string; valueBg?: string;
  icon?: React.ElementType; onEdit?: () => void; isDark: boolean;
}) {
  const t = tk(isDark);
  return (
    <div className="flex items-center justify-between py-3.5"
      style={{ borderBottom: `1px solid ${t.divider}` }}>
      <div className="flex items-center gap-2.5">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.textMuted }} />
        <span className="text-sm font-medium" style={{ color: t.textSub }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {valueBg ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{ color: valueColor, background: valueBg }}>
            {value}
          </span>
        ) : Icon ? (
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" style={{ color: valueColor ?? t.text }} />
            <span className="text-sm font-semibold" style={{ color: valueColor ?? t.text }}>{value}</span>
          </div>
        ) : (
          <span className="text-sm font-semibold" style={{ color: valueColor ?? t.text }}>{value}</span>
        )}
        {onEdit && (
          <button onClick={onEdit}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
            style={{ color: "#2563EB", background: isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF" }}>
            <Edit2 className="w-3 h-3" />Change
          </button>
        )}
      </div>
    </div>
  );
}
