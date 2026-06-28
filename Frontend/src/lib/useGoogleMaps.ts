import { useJsApiLoader } from "@react-google-maps/api";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "";

export function useGoogleMaps() {
  return useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    version: "weekly",
  });
}
