import { useCallback, useMemo } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMaps } from "../../../lib/useGoogleMaps";
import { DARK_MAP_STYLE } from "../../dashboard/components/DashboardGoogleMap";

const containerStyle = { width: "100%", height: "100%" };

const baseMapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
};

export function LocationMap({
  lat,
  lng,
  onPick,
  isDark,
}: {
  lat: number;
  lng: number;
  /** When omitted, the map is read-only (no click-to-pick, non-draggable marker). */
  onPick?: (lat: number, lng: number) => void;
  isDark?: boolean;
}) {
  const { isLoaded, loadError } = useGoogleMaps();

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  const readOnly = !onPick;

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      ...baseMapOptions,
      styles: isDark ? DARK_MAP_STYLE : undefined,
      // Lock interaction down a little in read-only mode (still pannable/zoomable).
      draggableCursor: readOnly ? "default" : undefined,
    }),
    [isDark, readOnly]
  );

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onPick && e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
    },
    [onPick]
  );

  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onPick && e.latLng) onPick(e.latLng.lat(), e.latLng.lng());
    },
    [onPick]
  );

  const fallback = (text: string) => (
    <div className="w-full h-full flex items-center justify-center text-center text-xs px-6"
      style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}>
      {text}
    </div>
  );

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return fallback("Add VITE_GOOGLE_MAPS_API_KEY to Frontend/.env to enable the map, then restart the dev server.");
  }
  if (loadError) return fallback("Failed to load Google Maps. Check the API key and that the Maps JavaScript API is enabled.");
  if (!isLoaded) return fallback("Loading map…");

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onClick={readOnly ? undefined : handleClick}
      options={mapOptions}
    >
      <MarkerF
        position={center}
        draggable={!readOnly}
        onDragEnd={readOnly ? undefined : handleDragEnd}
      />
    </GoogleMap>
  );
}
