import { MapPin } from "lucide-react";
import type { Issue, MapMarker } from "../../../lib";
import { ExploreMapView } from "./ExploreMapView";
import { IssuePopupCard } from "./IssuePopupCard";

interface MapSectionProps {
  markers: MapMarker[];
  activeCount: number;
  mineCount: number;
  othersCount: number;
  loading: boolean;
  error: string | null;
  activePin: string | null;
  onActivePin: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  isDark?: boolean;
  selectedIssue: Issue | null;
  selectedIsMine: boolean;
  detailLoading: boolean;
  distanceKm: number | null;
  supporting: boolean;
  supportCount: number;
  hasSupported?: boolean;
  onViewDetails: () => void;
  onNavigate: () => void;
  onSupport: () => void;
  onClosePopup: () => void;
}

export function MapSection({
  markers,
  activeCount,
  mineCount,
  othersCount,
  loading,
  error,
  activePin,
  onActivePin,
  userLocation,
  isDark,
  selectedIssue,
  selectedIsMine,
  detailLoading,
  distanceKm,
  supporting,
  supportCount,
  hasSupported,
  onViewDetails,
  onNavigate,
  onSupport,
  onClosePopup,
}: MapSectionProps) {
  return (
    <section className="shadow-sm rounded-3xl bg-card border-border border border-solid p-3 sm:p-4 overflow-hidden">
      <div className="relative rounded-[22px] bg-muted border-border border border-solid overflow-hidden h-72 sm:h-96 lg:h-105">
        {/* Real interactive map */}
        <div className="absolute inset-0">
          <ExploreMapView
            markers={markers}
            selectedId={activePin}
            onSelect={onActivePin}
            userLocation={userLocation}
            isDark={isDark}
          />
        </div>

        {/* Live tracking badge */}
        <div className="shadow-sm backdrop-blur-md rounded-full bg-card/90 text-xs sm:text-sm leading-5 border-border border border-solid flex absolute left-3 top-3 sm:left-6 sm:top-6 px-3 py-2 items-center gap-2 z-10 pointer-events-none">
          <MapPin className="size-4 text-[#2b7fff]" />
          <span className="font-medium hidden sm:inline">Live report tracking</span>
          <span className="font-medium sm:hidden">Live</span>
          <span className="font-medium rounded-full bg-[#2b7fff]/10 text-[#2b7fff] text-xs leading-4 px-2 py-0.5">
            {loading ? "…" : `${activeCount} active`}
          </span>
        </div>

        {/* Loading / error overlays */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60 text-sm text-muted-foreground">
            Loading reports…
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/80 px-6 text-center text-sm text-red-500">
            {error}
          </div>
        )}
        {!loading && !error && markers.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/70 px-6 text-center text-sm text-muted-foreground">
            No reports match the current filters.
          </div>
        )}

        {/* Selected issue popup */}
        {selectedIssue && (
          <div className="absolute left-3 right-3 bottom-3 sm:left-6 sm:bottom-6 sm:right-auto z-20 sm:max-w-md">
            <IssuePopupCard
              issue={selectedIssue}
              isMine={selectedIsMine}
              loading={detailLoading}
              distanceKm={distanceKm}
              supporting={supporting}
              supportCount={supportCount}
              hasSupported={hasSupported}
              onViewDetails={onViewDetails}
              onNavigate={onNavigate}
              onSupport={onSupport}
              onClose={onClosePopup}
            />
          </div>
        )}
      </div>

      <div className="text-muted-foreground text-xs leading-4 flex flex-col gap-2 mt-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-[#2b7fff]" />
          {loading
            ? "Loading map…"
            : `${markers.length} report${markers.length === 1 ? "" : "s"} shown` +
              (mineCount || othersCount
                ? ` · ${mineCount} yours · ${othersCount} from others`
                : "")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-red-500" /> Critical
          <span className="inline-flex size-2 rounded-full bg-orange-500 ml-2" /> High
          <span className="inline-flex size-2 rounded-full bg-green-500 ml-2" /> Resolved
        </div>
      </div>
    </section>
  );
}
