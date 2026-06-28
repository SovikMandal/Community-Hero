import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  issues as issuesApi,
  ApiError,
  categoryLabel,
  CATEGORY_OPTIONS,
  getCachedUser,
  statusLabel,
  type Issue,
  type IssueCategory,
  type IssueStatus,
  type MapMarker,
  type PriorityLevel,
} from "../../lib";
import { ExploreHeader } from "./components/ExploreHeader";
import { MapSection } from "./components/MapSection";
import { ReportStatusCard } from "./components/ReportStatusCard";
import { TimelineCard } from "./components/TimelineCard";
import { QuickActionsCard } from "./components/QuickActionsCard";

interface ExploreMapPageProps {
  userLocation?: { lat: number; lng: number } | null;
  isDark?: boolean;
}

const STATUS_OPTIONS: IssueStatus[] = [
  "REPORTED",
  "ACCEPTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
  "COMPLETED",
  "REJECTED",
];

const PRIORITY_OPTIONS: PriorityLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type Ownership = "ALL" | "MINE" | "OTHERS";

// Haversine distance in km between two lat/lng points.
function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function ExploreMapPage({ userLocation, isDark }: ExploreMapPageProps) {
  const navigate = useNavigate();
  const me = getCachedUser();
  const myId = me?.id ?? null;

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [supporting, setSupporting] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [hasSupported, setHasSupported] = useState(false);

  // Search + filter UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "ALL">("ALL");
  const [ownership, setOwnership] = useState<Ownership>("ALL");

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadMarkers = useCallback(async () => {
    setError(null);
    try {
      const data = await issuesApi.map();
      setMarkers(data);
    } catch {
      setError("Could not load map data. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDetail = useCallback((id: string | null) => {
    if (!id) {
      setSelectedIssue(null);
      return;
    }
    setDetailLoading(true);
    issuesApi
      .get(id)
      .then((iss) => setSelectedIssue(iss))
      .catch(() => setSelectedIssue(null))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Keep the displayed support count in sync with the loaded issue.
  useEffect(() => {
    setSupportCount(selectedIssue?._count?.supports ?? 0);
  }, [selectedIssue?._count?.supports, selectedIssue?.id]);

  // Reflect whether the current user has already supported this issue.
  useEffect(() => {
    setHasSupported(Boolean(selectedIssue?.supportedByMe));
  }, [selectedIssue?.supportedByMe, selectedIssue?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMarkers();
    loadDetail(selectedId);
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredMarkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return markers.filter((m) => {
      if (ownership === "MINE" && m.reporterId !== myId) return false;
      if (ownership === "OTHERS" && m.reporterId === myId) return false;
      if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && m.priority !== priorityFilter) return false;
      if (
        q &&
        !m.title.toLowerCase().includes(q) &&
        !categoryLabel(m.category).toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [markers, ownership, myId, categoryFilter, statusFilter, priorityFilter, searchQuery]);

  const activeCount = useMemo(
    () => filteredMarkers.filter((m) => m.status !== "COMPLETED").length,
    [filteredMarkers],
  );

  const mineCount = useMemo(
    () => (myId ? markers.filter((m) => m.reporterId === myId).length : 0),
    [markers, myId],
  );
  const othersCount = markers.length - mineCount;

  const selectedDistanceKm = useMemo(() => {
    if (!userLocation || !selectedIssue) return null;
    return distanceKm(userLocation, {
      lat: selectedIssue.latitude,
      lng: selectedIssue.longitude,
    });
  }, [userLocation, selectedIssue]);

  const filtersActive =
    ownership !== "ALL" ||
    categoryFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL";

  // ── Selection + actions ───────────────────────────────────────────────────────
  const handleSelect = (id: string | null) => {
    setActivePin(id);
    setSelectedId(id);
  };

  const handleViewDetails = () => {
    if (selectedId) navigate(`/track/${selectedId}`);
  };

  const handleNavigate = () => {
    if (!selectedIssue) return;
    const { latitude, longitude } = selectedIssue;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleShare = async () => {
    if (!selectedId) return;
    const url = `${window.location.origin}/track/${selectedId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selectedIssue?.title ?? "Civic report", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled share / clipboard blocked */
    }
  };

  const handleSupport = async () => {
    if (!selectedId || supporting || hasSupported) return;
    setSupporting(true);
    // Optimistic bump so the count reacts instantly.
    setSupportCount((c) => c + 1);
    try {
      const { count } = await issuesApi.support(selectedId);
      setSupportCount(count);
      setHasSupported(true);
      loadDetail(selectedId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already supported — keep it marked, sync the real count.
        setHasSupported(true);
        loadDetail(selectedId);
      } else {
        // Roll back the optimistic bump on failure.
        setSupportCount((c) => Math.max(0, c - 1));
      }
    } finally {
      setSupporting(false);
    }
  };

  const resetFilters = () => {
    setOwnership("ALL");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  return (
    <div className={(isDark ? "dark " : "") + "text-foreground w-full h-fit"}>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 w-full">
        <ExploreHeader
          searchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          filtersOpen={filtersOpen}
          filtersActive={filtersActive}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {/* Search bar */}
        {searchOpen && (
          <div className="mt-4 relative">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title or category…"
              className="w-full rounded-2xl border-border border border-solid bg-card text-foreground px-4 h-11 text-sm outline-none focus:border-[#2b7fff]"
            />
            {searchQuery.trim() && (
              <div className="absolute z-20 left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-card border-border border border-solid shadow-lg">
                {filteredMarkers.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No reports match “{searchQuery}”.
                  </div>
                ) : (
                  filteredMarkers.slice(0, 12).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        handleSelect(m.id);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-sm leading-5">
                          {m.title}
                        </div>
                        <div className="text-muted-foreground text-xs leading-4">
                          {categoryLabel(m.category)} · {statusLabel(m.status)}
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">{m.priority}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {filtersOpen && (
          <div className="mt-4 rounded-2xl bg-muted p-4 flex flex-col gap-3">
            <FilterRow label="Show">
              <FilterChip
                active={ownership === "ALL"}
                onClick={() => setOwnership("ALL")}
              >
                All reports ({markers.length})
              </FilterChip>
              <FilterChip
                active={ownership === "MINE"}
                onClick={() => setOwnership("MINE")}
              >
                My reports ({mineCount})
              </FilterChip>
              <FilterChip
                active={ownership === "OTHERS"}
                onClick={() => setOwnership("OTHERS")}
              >
                Others ({othersCount})
              </FilterChip>
            </FilterRow>
            <FilterRow label="Category">
              <FilterChip
                active={categoryFilter === "ALL"}
                onClick={() => setCategoryFilter("ALL")}
              >
                All
              </FilterChip>
              {CATEGORY_OPTIONS.map((c) => (
                <FilterChip
                  key={c.value}
                  active={categoryFilter === c.value}
                  onClick={() => setCategoryFilter(c.value)}
                >
                  {c.label}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Status">
              <FilterChip
                active={statusFilter === "ALL"}
                onClick={() => setStatusFilter("ALL")}
              >
                All
              </FilterChip>
              {STATUS_OPTIONS.map((s) => (
                <FilterChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {statusLabel(s)}
                </FilterChip>
              ))}
            </FilterRow>
            <FilterRow label="Priority">
              <FilterChip
                active={priorityFilter === "ALL"}
                onClick={() => setPriorityFilter("ALL")}
              >
                All
              </FilterChip>
              {PRIORITY_OPTIONS.map((p) => (
                <FilterChip
                  key={p}
                  active={priorityFilter === p}
                  onClick={() => setPriorityFilter(p)}
                >
                  {p}
                </FilterChip>
              ))}
            </FilterRow>
            {filtersActive && (
              <button
                onClick={resetFilters}
                className="self-start text-[#2b7fff] text-xs font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 mt-6 gap-6">
          <MapSection
            markers={filteredMarkers}
            activeCount={activeCount}
            mineCount={mineCount}
            othersCount={othersCount}
            loading={loading}
            error={error}
            activePin={activePin}
            onActivePin={handleSelect}
            userLocation={userLocation}
            isDark={isDark}
            selectedIssue={selectedIssue}
            selectedIsMine={!!selectedIssue && selectedIssue.reporterId === myId}
            detailLoading={detailLoading}
            distanceKm={selectedDistanceKm}
            supporting={supporting}
            supportCount={supportCount}
            hasSupported={hasSupported}
            onViewDetails={handleViewDetails}
            onNavigate={handleNavigate}
            onSupport={handleSupport}
            onClosePopup={() => handleSelect(null)}
          />
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportStatusCard issue={selectedIssue} loading={detailLoading} />
            <TimelineCard issue={selectedIssue} loading={detailLoading} />
            <QuickActionsCard
              issue={selectedIssue}
              onViewReport={handleViewDetails}
              onAddPhoto={handleViewDetails}
              onShare={handleShare}
              onSupport={handleSupport}
              supporting={supporting}
              supportCount={supportCount}
              hasSupported={hasSupported}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs uppercase tracking-wide w-16 shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-xs font-medium border border-solid transition-colors " +
        (active
          ? "bg-[#2b7fff] text-white border-[#2b7fff]"
          : "bg-card text-foreground border-border hover:bg-accent")
      }
    >
      {children}
    </button>
  );
}

export default ExploreMapPage;
