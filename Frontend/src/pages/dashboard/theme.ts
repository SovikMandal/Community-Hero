// Theme tokens for the dashboard. `isDark` toggles the dark palette.
export function tk(isDark: boolean) {
  return {
    pageBg:       isDark ? "#0B1120" : "#F0F5FF",
    gridLine:     isDark ? "rgba(99,130,255,0.18)" : "rgba(37,99,235,0.06)",
    sidebar:      isDark ? "#000000" : "#FFFFFF",
    sidebarBorder:isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    header:       isDark ? "rgba(0,0,0,0.90)" : "rgba(255,255,255,0.90)",
    headerBorder: isDark ? "rgba(255,255,255,0.18)" : "#F1F5F9",
    card:         isDark ? "#000000" : "#FFFFFF",
    cardBorder:   isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.07)",
    cardShadow:   isDark ? "0 2px 16px rgba(0,0,0,0.30)" : "0 2px 16px rgba(15,23,42,0.05)",
    text:         isDark ? "#E2E8F0" : "#0F172A",
    textSub:      isDark ? "#94A3B8" : "#64748B",
    textMuted:    isDark ? "#475569" : "#94A3B8",
    inputBg:      isDark ? "#1E293B" : "#F8FAFC",
    inputBorder:  isDark ? "rgba(255,255,255,0.16)" : "#E2E8F0",
    divider:      isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    navActive:    isDark ? "rgba(37,99,235,0.18)" : "#EFF6FF",
    navHover:     isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
    tagBg:        isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9",
    tagText:      isDark ? "#94A3B8" : "#64748B",
    rowHover:     isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
  };
}

export type DashboardTheme = ReturnType<typeof tk>;
