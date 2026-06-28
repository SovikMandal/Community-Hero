import { useState } from "react";
import { tk } from "../theme";

// A labelled text/textarea field the user can edit (title, description, location).
export function EditableField({
  label, value, onChange, multiline, isDark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; isDark: boolean;
}) {
  const t = tk(isDark);
  const [focused, setFocused] = useState(false);
  const base = {
    background: focused ? (isDark ? "#1A2744" : "#FFFFFF") : t.inputBg,
    borderColor: focused ? "#2563EB" : t.inputBorder,
    boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.10)" : "none",
  };
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: t.textSub }}>{label}</label>
      <div className="rounded-2xl border px-4 py-3 transition-all"
        style={{ background: base.background, borderColor: base.borderColor, boxShadow: base.boxShadow }}>
        {multiline ? (
          <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="bg-transparent resize-none outline-none w-full text-sm"
            style={{ color: t.text, fontFamily: "Inter, sans-serif" }} />
        ) : (
          <input value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="bg-transparent outline-none w-full text-sm"
            style={{ color: t.text, fontFamily: "Inter, sans-serif" }} />
        )}
      </div>
    </div>
  );
}
