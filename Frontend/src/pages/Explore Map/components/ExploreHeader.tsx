import { Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface ExploreHeaderProps {
  searchOpen: boolean;
  onToggleSearch: () => void;
  filtersOpen: boolean;
  filtersActive: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function ExploreHeader({
  searchOpen,
  onToggleSearch,
  filtersOpen,
  filtersActive,
  onToggleFilters,
  onRefresh,
  refreshing,
}: ExploreHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-6">
      <div>
        <div className="text-muted-foreground text-sm leading-5">
          Track and monitor the progress of your citys civics reports.
        </div>
        <h1 className="font-semibold text-2xl sm:text-3xl leading-9 tracking-tight mt-1">
          Explore Map
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          onClick={onToggleSearch}
          className={
            "shadow-sm rounded-full border-border border-0 border-solid px-4 h-11 " +
            (searchOpen ? "bg-accent" : "")
          }
        >
          <Search className="size-4 mr-2" />
          <span className="hidden sm:inline">Search Reports</span>
          <span className="sm:hidden">Search</span>
        </Button>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={
            "relative shadow-sm rounded-full border-border border-0 border-solid px-4 h-11 " +
            (filtersOpen ? "bg-accent" : "")
          }
        >
          <Filter className="size-4 mr-2" />
          Filters
          {filtersActive && (
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#2b7fff]" />
          )}
        </Button>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          className="shadow-sm rounded-full bg-[#2b7fff] text-blue-50 px-4 h-11"
        >
          <RefreshCw className={"size-4 mr-2 " + (refreshing ? "animate-spin" : "")} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
