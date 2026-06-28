import { X } from "lucide-react";
import {
  categoryLabel,
  priorityColor,
  statusLabel,
  type Issue,
} from "../../../lib";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

interface IssuePopupCardProps {
  issue: Issue;
  isMine: boolean;
  loading: boolean;
  distanceKm: number | null;
  supporting: boolean;
  supportCount: number;
  hasSupported?: boolean;
  onViewDetails: () => void;
  onNavigate: () => void;
  onSupport: () => void;
  onClose: () => void;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

export function IssuePopupCard({
  issue,
  isMine,
  loading,
  distanceKm,
  supporting,
  supportCount,
  hasSupported,
  onViewDetails,
  onNavigate,
  onSupport,
  onClose,
}: IssuePopupCardProps) {
  const image = issue.images?.find((i) => !i.isVideo)?.url ?? FALLBACK_IMG;
  const reportedAt = new Date(issue.createdAt).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const distanceText =
    distanceKm != null
      ? `${distanceKm.toFixed(1)} km from your location`
      : issue.address ?? "Location on map";

  return (
    <div className="shadow-xl backdrop-blur-md rounded-2xl sm:rounded-[20px] bg-card/95 border-border border border-solid p-2.5 sm:p-4">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex size-6 sm:size-7 items-center justify-center rounded-full bg-card/90 border-border border border-solid text-muted-foreground hover:bg-accent"
      >
        <X className="size-3.5" />
      </button>
      <div className="flex items-start gap-2.5 sm:gap-4">
        <img
          src={image}
          alt={issue.title}
          className="object-cover rounded-xl sm:rounded-2xl w-12 h-12 sm:w-24 sm:h-24 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-center gap-2 sm:gap-3 pr-5 sm:pr-6">
            <div className="min-w-0">
              <div className="font-semibold text-[13px] sm:text-sm leading-5 truncate">
                {issue.title}
              </div>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                {isMine && (
                  <span className="font-semibold rounded-full bg-[#2b7fff]/10 text-[#2b7fff] text-[10px] leading-4 px-2 py-0.5">
                    Your report
                  </span>
                )}
                <span className="text-muted-foreground text-[11px] sm:text-xs leading-4 truncate">
                  {distanceText}
                </span>
              </div>
            </div>
            <Badge
              className="font-semibold rounded-full text-white text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 shrink-0"
              style={{ backgroundColor: priorityColor(issue.priority) }}
            >
              {issue.priority}
            </Badge>
          </div>
          <div className="flex mt-2 sm:mt-3 flex-wrap gap-1.5 sm:gap-2">
            <Badge variant="secondary" className="rounded-full">
              {categoryLabel(issue.category)}
            </Badge>
            <Badge variant="outline" className="rounded-full hidden sm:inline-flex">
              {issue.severity} severity
            </Badge>
            <Badge variant="outline" className="rounded-full hidden sm:inline-flex">
              {issue.department?.name
                ? `Assigned: ${issue.department.name}`
                : "Unassigned"}
            </Badge>
          </div>
          <div className="hidden sm:grid grid-cols-2 text-muted-foreground text-xs leading-4 mt-3 gap-2">
            <div className="rounded-xl bg-muted px-3 py-2">
              <div className="uppercase text-[11px] tracking-wide">Reported</div>
              <div className="font-medium text-foreground mt-1">{reportedAt}</div>
            </div>
            <div className="rounded-xl bg-muted px-3 py-2">
              <div className="uppercase text-[11px] tracking-wide">Status</div>
              <div className="font-medium text-foreground mt-1">
                {statusLabel(issue.status)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap mt-2.5 sm:mt-4 gap-1.5 sm:gap-2">
            <Button
              onClick={onViewDetails}
              className="rounded-full bg-[#2b7fff] text-blue-50 text-xs leading-4 px-3 sm:px-4 h-8 sm:h-9"
            >
              View Details
            </Button>
            <Button
              variant="outline"
              onClick={onNavigate}
              className="rounded-full text-xs leading-4 px-3 sm:px-4 h-8 sm:h-9"
            >
              Navigate
            </Button>
            <Button
              variant="outline"
              onClick={onSupport}
              disabled={supporting || loading || hasSupported}
              className="rounded-full text-xs leading-4 px-3 sm:px-4 h-8 sm:h-9"
            >
              {hasSupported
                ? "Supported"
                : supporting
                  ? "Supporting…"
                  : `Support (${supportCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
