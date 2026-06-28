import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleMap, OverlayViewF } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "../../../lib/useGoogleMaps";

const mapContainerStyle = { width: "100%", height: "100%" };
const baseMapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
  clickableIcons: false,
};

// Google Maps "night mode" style applied when the dashboard is in dark mode.
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1120" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1120" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f1f17" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4ade80" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1a2b" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
];

export function pinColor(marker: { status: string; priority: string; isEmergency: boolean }): string {
  if (marker.status === "COMPLETED") return "green";
  if (marker.isEmergency || marker.priority === "CRITICAL") return "red";
  if (marker.priority === "HIGH") return "orange";
  return "blue";
}

// Markers reported at (nearly) the same coordinates would render exactly on top
// of one another. Fan co-located markers out in a small circle so every pin is
// visible. Selection still uses the real marker id, so behaviour is unchanged.
function spreadOverlapping<T extends { latitude: number; longitude: number }>(
  markers: T[],
): Array<T & { dlat: number; dlng: number }> {
  const groups = new Map<string, T[]>();
  for (const m of markers) {
    const key = `${m.latitude.toFixed(5)},${m.longitude.toFixed(5)}`;
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else groups.set(key, [m]);
  }

  const result: Array<T & { dlat: number; dlng: number }> = [];
  for (const arr of groups.values()) {
    if (arr.length === 1) {
      result.push({ ...arr[0], dlat: arr[0].latitude, dlng: arr[0].longitude });
      continue;
    }
    // Fan radius ~12m; grows slightly for larger clusters.
    const radius = 0.00011 * (1 + (arr.length - 2) * 0.15);
    arr.forEach((m, i) => {
      const angle = (2 * Math.PI * i) / arr.length;
      result.push({
        ...m,
        dlat: m.latitude + radius * Math.cos(angle),
        dlng: m.longitude + radius * Math.sin(angle),
      });
    });
  }
  return result;
}

interface DashboardGoogleMapProps {
  markers: Array<{ id: string; title: string; latitude: number; longitude: number; status: string; priority: string; isEmergency: boolean; category: string; createdAt?: string; reporter?: { name: string }; _count?: { votes: number } }>;
  activePin: string | null;
  setActivePin: (v: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  showHeat?: boolean;
  isDark?: boolean;
}

export function DashboardGoogleMap({ markers, activePin, setActivePin, userLocation, showHeat, isDark }: DashboardGoogleMapProps) {
  const { isLoaded } = useGoogleMaps();

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({ ...baseMapOptions, styles: isDark ? DARK_MAP_STYLE : undefined }),
    [isDark],
  );

  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (markers.length === 0) return { lat: 22.5726, lng: 88.3639 };
    const avgLat = markers.reduce((s, m) => s + m.latitude, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.longitude, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers, userLocation]);

  const displayMarkers = useMemo(() => spreadOverlapping(markers), [markers]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return <div className="w-full h-full flex items-center justify-center text-xs text-center px-4" style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}>Add VITE_GOOGLE_MAPS_API_KEY to Frontend/.env</div>;
  }
  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}>Loading map…</div>;
  }

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13} options={mapOptions} onClick={() => setActivePin(null)}>
      {userLocation && (
        <OverlayViewF position={userLocation} mapPaneName="floatPane">
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
          </div>
        </OverlayViewF>
      )}
      {displayMarkers.map((m) => {
        const color = pinColor(m);
        const isActive = activePin === m.id;
        return (
          <OverlayViewF key={m.id} position={{ lat: m.dlat, lng: m.dlng }} mapPaneName="floatPane">
            <motion.div
              className="cursor-pointer -translate-x-1/2 -translate-y-full"
              initial={{ y: -20, opacity: 0, scale: 0 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              onClick={(e) => { e.stopPropagation(); setActivePin(isActive ? null : m.id); }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="relative"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-xl"
                  style={{ background: color }}
                >
                  <MapPin className="w-4 h-4 text-white fill-white" />
                </div>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${color}` }}
                    animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.div>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl px-3 py-2 shadow-xl whitespace-nowrap z-50"
                    style={{ minWidth: 180 }}
                  >
                    <div className="flex gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: m.priority === "CRITICAL" ? "#FEE2E2" : m.priority === "HIGH" ? "#FEF3C7" : "#DBEAFE", color: m.priority === "CRITICAL" ? "#DC2626" : m.priority === "HIGH" ? "#D97706" : "#2563EB" }}>
                        {m.priority}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: m.status === "COMPLETED" ? "#DCFCE7" : "#F1F5F9", color: m.status === "COMPLETED" ? "#16A34A" : "#475569" }}>
                        {m.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 mb-1">{m.title.length > 40 ? m.title.slice(0, 40) + "…" : m.title}</div>
                    <div className="text-[11px] text-slate-500">👤 {m.reporter?.name ?? "Anonymous"}</div>
                    {m.createdAt && <div className="text-[11px] text-slate-500">🕐 {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </OverlayViewF>
        );
      })}
      {showHeat && displayMarkers.map((m) => {
        const size = m.priority === "CRITICAL" ? 80 : m.priority === "HIGH" ? 60 : 40;
        const color = m.priority === "CRITICAL" ? "rgba(239,68,68,0.35)" : m.priority === "HIGH" ? "rgba(245,158,11,0.3)" : "rgba(37,99,235,0.2)";
        return (
          <OverlayViewF key={`heat-${m.id}`} position={{ lat: m.dlat, lng: m.dlng }} mapPaneName="overlayLayer">
            <div style={{
              width: size, height: size, borderRadius: "50%",
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              transform: "translate(-50%, -50%)", pointerEvents: "none",
            }} />
          </OverlayViewF>
        );
      })}
    </GoogleMap>
  );
}
