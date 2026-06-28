// Presentation helpers: map backend enums/values to the UI's display strings,
// colours, and layout coordinates. Keeps components free of mapping noise.

import type {
  IssueCategory,
  IssueStatus,
  MapMarker,
  PriorityLevel,
  Severity,
} from "./types";

// ── Category labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<IssueCategory, string> = {
  POTHOLE: "Pothole",
  WATER_LEAKAGE: "Water Leakage",
  GARBAGE: "Garbage",
  STREET_LIGHT: "Street Light",
  ROAD_DAMAGE: "Road Damage",
  OPEN_MANHOLE: "Open Manhole",
  ILLEGAL_DUMPING: "Illegal Dumping",
  FALLEN_TREE: "Fallen Tree",
  DRAINAGE_BLOCKAGE: "Drainage Blockage",
  OTHER: "Other",
};

export function categoryLabel(category: IssueCategory | string | null | undefined): string {
  if (!category) return "Other";
  return CATEGORY_LABELS[category as IssueCategory] ?? "Other";
}

/** UI dropdown options → backend enum value. */
export const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = (
  Object.keys(CATEGORY_LABELS) as IssueCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

// ── Status → the dashboard's statusMap keys (Resolved/Processing/Verified/Critical) ──
export function statusToUiKey(status: IssueStatus): "Resolved" | "Processing" | "Verified" | "Critical" {
  switch (status) {
    case "COMPLETED":
      return "Resolved";
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Critical";
    case "REPORTED":
    case "ASSIGNED":
    case "ENGINEER_VISITED":
    case "REPAIR_STARTED":
    default:
      return "Processing";
  }
}

export function statusLabel(status: IssueStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Priority / severity colours ──────────────────────────────────────────────
export function priorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case "CRITICAL":
      return "#EF4444";
    case "HIGH":
      return "#F59E0B";
    case "MEDIUM":
      return "#2563EB";
    case "LOW":
    default:
      return "#22C55E";
  }
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case "CRITICAL":
      return "#EF4444";
    case "HIGH":
      return "#F97316";
    case "MEDIUM":
      return "#F59E0B";
    case "LOW":
    default:
      return "#22C55E";
  }
}

// ── Relative time ────────────────────────────────────────────────────────────
export function timeAgo(iso: string | Date | undefined | null): string {
  if (!iso) return "";
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return then.toLocaleDateString();
}

// ── A short, human-friendly ID for display (CIV-xxxx style) ──────────────────
export function shortId(id: string): string {
  const tail = id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  return `CIV-${tail}`;
}

// ── Project lat/lng markers into a 0–100% box for the stylised SVG map ───────
export interface PositionedMarker extends MapMarker {
  /** 0–100 horizontal % */
  x: number;
  /** 0–100 vertical % */
  y: number;
  color: string;
}

export function projectMarkers(markers: MapMarker[]): PositionedMarker[] {
  if (markers.length === 0) return [];

  const lats = markers.map((m) => m.latitude);
  const lngs = markers.map((m) => m.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;

  // Pad to 10–90% so pins don't sit on the edges.
  const scale = (value: number, min: number, span: number) => 10 + ((value - min) / span) * 80;

  return markers.map((m) => ({
    ...m,
    x: scale(m.longitude, minLng, lngSpan),
    // Invert latitude so north is up.
    y: 100 - scale(m.latitude, minLat, latSpan),
    color:
      m.status === "COMPLETED"
        ? "#22C55E"
        : m.isEmergency || m.priority === "CRITICAL"
        ? "#EF4444"
        : priorityColor(m.priority),
  }));
}
