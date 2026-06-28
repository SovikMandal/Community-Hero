import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleMap, OverlayViewF } from "@react-google-maps/api";
import { MapPin, X, LocateFixed, Loader2 } from "lucide-react";
import { useGoogleMaps, MAP_ID } from "../../../lib/useGoogleMaps";
import { categoryLabel, statusLabel, type MapMarker } from "../../../lib";
import { pinColor, DARK_MAP_STYLE } from "../../dashboard/components/DashboardGoogleMap";

const mapContainerStyle = { width: "100%", height: "100%" };

// Vector maps with mapId enable 3D raised buildings natively.
// The styles array is intentionally NOT used here because it forces
// raster tile rendering which disables 3D buildings entirely.
const baseMapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
  clickableIcons: false,
  // 3D raised building settings
  tilt: 45,
  heading: 0,
  mapTypeId: "roadmap",
  rotateControl: true,
  // mapId enables vector rendering → 3D extruded buildings
  ...(MAP_ID ? { mapId: MAP_ID } : {}),
};

interface Cluster {
  key: string;
  lat: number;
  lng: number;
  items: MapMarker[];
}

interface ExploreMapViewProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  isDark?: boolean;
}

// Group markers that sit at (nearly) the same coordinate so a stack renders as
// one cluster pin instead of pins drawn on top of each other.
function clusterMarkers(markers: MapMarker[]): Cluster[] {
  const groups = new Map<string, MapMarker[]>();
  for (const m of markers) {
    const key = `${m.latitude.toFixed(4)},${m.longitude.toFixed(4)}`;
    const arr = groups.get(key);
    if (arr) arr.push(m);
    else groups.set(key, [m]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    lat: items.reduce((s, m) => s + m.latitude, 0) / items.length,
    lng: items.reduce((s, m) => s + m.longitude, 0) / items.length,
    items,
  }));
}

// Most severe pin colour in a stack drives the cluster colour.
function clusterColor(items: MapMarker[]): string {
  if (items.some((m) => m.isEmergency || m.priority === "CRITICAL")) return "red";
  if (items.some((m) => m.priority === "HIGH")) return "orange";
  if (items.every((m) => m.status === "COMPLETED")) return "green";
  return "blue";
}

export function ExploreMapView({
  markers,
  selectedId,
  onSelect,
  userLocation,
  isDark,
}: ExploreMapViewProps) {
  const { isLoaded } = useGoogleMaps();
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [locating, setLocating] = useState(false);
  // Location discovered locally via the button, used if the prop isn't set.
  const [locatedPos, setLocatedPos] = useState<{ lat: number; lng: number } | null>(null);
  const here = userLocation ?? locatedPos;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Force the 3D tilt after the map is fully initialised.
    // This ensures the vector renderer applies the tilt even if the initial
    // option was ignored during raster→vector transition.
    setTimeout(() => {
      map.setTilt(45);
      map.setHeading(0);
    }, 300);
  }, []);

  const goToMyLocation = useCallback(() => {
    const pan = (pos: { lat: number; lng: number }) => {
      mapRef.current?.panTo(pos);
      mapRef.current?.setZoom(17);
      // Re-apply tilt after zoom change
      setTimeout(() => {
        mapRef.current?.setTilt(45);
      }, 200);
    };
    if (here) {
      pan(here);
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLocatedPos(pos);
        pan(pos);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [here]);

  // When mapId is set → vector rendering with 3D buildings + colorScheme for dark mode.
  // When mapId is absent → raster fallback with styles array for dark theme (no 3D).
  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      ...baseMapOptions,
      ...(MAP_ID
        ? { colorScheme: isDark ? "DARK" : "LIGHT" }
        : { styles: isDark ? DARK_MAP_STYLE : undefined }),
    }),
    [isDark],
  );

  const clusters = useMemo(() => clusterMarkers(markers), [markers]);

  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (markers.length === 0) return { lat: 22.5726, lng: 88.3639 };
    const avgLat = markers.reduce((s, m) => s + m.latitude, 0) / markers.length;
    const avgLng = markers.reduce((s, m) => s + m.longitude, 0) / markers.length;
    return { lat: avgLat, lng: avgLng };
  }, [markers, userLocation]);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-center px-4" style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}>
        Add VITE_GOOGLE_MAPS_API_KEY to Frontend/.env
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}>
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={mapOptions}
        onLoad={onMapLoad}
        onClick={() => setOpenCluster(null)}
      >
      {here && (
        <OverlayViewF position={here} mapPaneName="floatPane">
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
          </div>
        </OverlayViewF>
      )}

      {clusters.map((cluster) => {
        const isStack = cluster.items.length > 1;
        const color = isStack
          ? clusterColor(cluster.items)
          : pinColor(cluster.items[0]);
        const isOpen = openCluster === cluster.key;
        const single = cluster.items[0];
        const isActive = !isStack && selectedId === single.id;

        return (
          <OverlayViewF key={cluster.key} position={{ lat: cluster.lat, lng: cluster.lng }} mapPaneName="floatPane">
            <div className="relative">
              {/* Pin / cluster marker */}
              <motion.div
                className="cursor-pointer -translate-x-1/2 -translate-y-full"
                initial={{ y: -20, opacity: 0, scale: 0 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isStack) {
                    setOpenCluster(isOpen ? null : cluster.key);
                  } else {
                    setOpenCluster(null);
                    onSelect(single.id);
                  }
                }}
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
                  {isStack && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-card text-[11px] font-bold flex items-center justify-center shadow border border-border" style={{ color }}>
                      {cluster.items.length}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${color}` }}
                      animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                </motion.div>
              </motion.div>

              {/* Cluster chooser popup */}
              <AnimatePresence>
                {isStack && isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card rounded-2xl shadow-xl border border-border p-3 z-50"
                    style={{ width: "min(360px, 86vw)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground">
                        {cluster.items.length} reports here
                      </span>
                      <button
                        onClick={() => setOpenCluster(null)}
                        aria-label="Close"
                        className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto">
                      {cluster.items.map((m) => {
                        const c = pinColor(m);
                        const active = selectedId === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              onSelect(m.id);
                              setOpenCluster(null);
                            }}
                            title={`${m.title} · ${statusLabel(m.status)}`}
                            className={
                              "flex flex-col items-center gap-1 rounded-xl p-1.5 transition-colors " +
                              (active ? "bg-[#2b7fff]/10" : "hover:bg-accent")
                            }
                          >
                            <span
                              className="size-8 rounded-full flex items-center justify-center shadow"
                              style={{ background: c }}
                            >
                              <MapPin className="size-4 text-white fill-white" />
                            </span>
                            <span className="text-[10px] leading-3 text-center text-muted-foreground line-clamp-2 w-full">
                              {categoryLabel(m.category)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {/* little pointer */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 size-3 rotate-45 bg-card border-b border-r border-border" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </OverlayViewF>
        );
      })}
      </GoogleMap>

      {/* Self-locating button */}
      <button
        type="button"
        onClick={goToMyLocation}
        disabled={locating}
        aria-label="Center map on my location"
        title="My location"
        className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-card/95 backdrop-blur-md shadow-md border border-border text-foreground hover:bg-accent disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="size-4 animate-spin text-[#2b7fff]" />
        ) : (
          <LocateFixed className="size-4 text-[#2b7fff]" />
        )}
      </button>
    </div>
  );
}
