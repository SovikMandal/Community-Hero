import { useState } from "react";

export function InputField({
  icon: Icon,
  label,
  type,
  placeholder,
  value,
  onChange,
  rightSlot,
  required,
  isDark = false,
  autoComplete,
}: {
  icon: React.ElementType;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rightSlot?: React.ReactNode;
  required?: boolean;
  isDark?: boolean;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: isDark ? "#94A3B8" : "#475569" }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150"
        style={{
          background: isDark ? (focused ? "#1E293B" : "rgba(255,255,255,0.03)") : (focused ? "#FFFFFF" : "#F8FAFC"),
          borderColor: focused ? "#2563EB" : (isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.10)"),
          boxShadow: focused ? "0 0 0 3px rgba(37,99,235,0.10)" : "none",
        }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: focused ? "#2563EB" : "#94A3B8" }} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoComplete={autoComplete ?? "off"}
          className="flex-1 bg-transparent placeholder-slate-400 text-sm outline-none"
          style={{ fontFamily: "Inter, sans-serif", color: isDark ? "#E2E8F0" : "#0F172A" }}
        />
        {rightSlot}
      </div>
    </div>
  );
}
