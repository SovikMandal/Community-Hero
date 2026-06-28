// Theme tokens for the Report Issue flow. `d` = dark mode on/off.
export function tk(d: boolean) {
  return {
    pageBg:      d ? "#0B1120" : "#F0F5FF",
    card:        d ? "#000000" : "#FFFFFF",
    cardBorder:  d ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.07)",
    cardShadow:  d ? "0 2px 20px rgba(0,0,0,0.30)" : "0 2px 20px rgba(15,23,42,0.06)",
    text:        d ? "#E2E8F0" : "#0F172A",
    textSub:     d ? "#94A3B8" : "#64748B",
    textMuted:   d ? "#475569" : "#94A3B8",
    inputBg:     d ? "#1A2744" : "#F8FAFC",
    inputBorder: d ? "rgba(255,255,255,0.16)" : "#E2E8F0",
    divider:     d ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    tagBg:       d ? "rgba(255,255,255,0.07)" : "#F1F5F9",
    dropZone:    d ? "rgba(37,99,235,0.06)" : "#EFF6FF",
    dropBorder:  d ? "rgba(37,99,235,0.25)" : "#BFDBFE",
    lockedBg:    d ? "rgba(255,255,255,0.04)" : "#F8FAFC",
  };
}

export type ReportTheme = ReturnType<typeof tk>;
