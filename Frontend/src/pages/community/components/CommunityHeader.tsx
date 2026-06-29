import { useState, useEffect, useRef } from "react";
import { Search, Filter, SlidersHorizontal, Check } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { IssueCategory } from "../../../lib";

export type SortOption = "newest" | "oldest" | "most_verified" | "highest_confidence";

interface CommunityHeaderProps {
  t: DashboardTheme;
  isDark: boolean;
  search: string;
  setSearch: (v: string) => void;
  filterCategory: IssueCategory | "ALL";
  setFilterCategory: (v: IssueCategory | "ALL") => void;
  sort: SortOption;
  setSort: (v: SortOption) => void;
}

const CATEGORIES: { value: IssueCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Categories" },
  { value: "POTHOLE", label: "Pothole" },
  { value: "WATER_LEAKAGE", label: "Water Leakage" },
  { value: "GARBAGE", label: "Garbage" },
  { value: "STREET_LIGHT", label: "Street Light" },
  { value: "ROAD_DAMAGE", label: "Road Damage" },
  { value: "OPEN_MANHOLE", label: "Open Manhole" },
  { value: "ILLEGAL_DUMPING", label: "Illegal Dumping" },
  { value: "FALLEN_TREE", label: "Fallen Tree" },
  { value: "DRAINAGE_BLOCKAGE", label: "Drainage Blockage" },
  { value: "OTHER", label: "Other" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "most_verified", label: "Most Verified" },
  { value: "highest_confidence", label: "Highest Confidence" },
];

export function CommunityHeader({
  t, search, setSearch, filterCategory, setFilterCategory, sort, setSort,
}: CommunityHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl md:text-3xl tracking-tight" style={{ color: t.text }}>
          Community
        </h1>
        <p className="text-sm" style={{ color: t.textSub }}>
          Help verify reports and improve AI accuracy.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: t.textMuted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-xl border outline-none text-sm pl-9 pr-4 py-2.5 transition-colors"
            style={{ background: t.card, borderColor: t.inputBorder, color: t.text }}
          />
        </div>

        {/* Filter + Sort — share a single row on mobile */}
        <div className="flex flex-row gap-3">
        {/* Filter dropdown */}
        <div className="relative flex-1 sm:flex-none" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="w-full rounded-xl border text-sm font-medium flex px-4 py-2.5 items-center justify-center gap-2 transition-colors"
            style={{ background: t.card, borderColor: filterCategory !== "ALL" ? "#2563EB" : t.inputBorder, color: filterCategory !== "ALL" ? "#2563EB" : t.text }}
          >
            <Filter className="size-4" />
            {filterCategory === "ALL" ? "Filter" : CATEGORIES.find(c => c.value === filterCategory)?.label}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border shadow-lg overflow-hidden" style={{ background: t.card, borderColor: t.inputBorder }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setFilterCategory(c.value); setFilterOpen(false); }}
                  className="w-full text-left text-sm px-4 py-2.5 flex items-center justify-between transition-colors hover:opacity-80"
                  style={{ color: filterCategory === c.value ? "#2563EB" : t.text }}
                >
                  {c.label}
                  {filterCategory === c.value && <Check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative flex-1 sm:flex-none" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="w-full rounded-xl text-sm font-medium flex px-4 py-2.5 items-center justify-center gap-2 transition-colors"
            style={{ background: "#2563EB", color: "#FFFFFF" }}
          >
            <SlidersHorizontal className="size-4" />
            {SORT_OPTIONS.find(s => s.value === sort)?.label}
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border shadow-lg overflow-hidden" style={{ background: t.card, borderColor: t.inputBorder }}>
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSort(s.value); setSortOpen(false); }}
                  className="w-full text-left text-sm px-4 py-2.5 flex items-center justify-between transition-colors hover:opacity-80"
                  style={{ color: sort === s.value ? "#2563EB" : t.text }}
                >
                  {s.label}
                  {sort === s.value && <Check className="size-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
