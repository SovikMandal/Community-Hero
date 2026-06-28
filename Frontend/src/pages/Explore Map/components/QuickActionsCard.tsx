import { ThumbsUp, ArrowRight } from "lucide-react";
import { shortId, type Issue } from "../../../lib";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

interface QuickActionsCardProps {
  issue: Issue | null;
  onViewReport: () => void;
  onAddPhoto: () => void;
  onShare: () => void;
  onSupport: () => void;
  supporting: boolean;
  supportCount: number;
  hasSupported?: boolean;
  /**
   * Admin action mode. When `onAction` is provided, the Support button is
   * replaced by an action button (labelled `actionLabel`, default "Action").
   */
  onAction?: () => void;
  actionLabel?: string;
}

export function QuickActionsCard({
  issue,
  onViewReport,
  onAddPhoto,
  onShare,
  onSupport,
  supporting,
  supportCount,
  hasSupported,
  onAction,
  actionLabel,
}: QuickActionsCardProps) {
  const disabled = !issue;

  return (
    <Card className="shadow-sm rounded-3xl border-border border border-solid p-5 gap-4">
      <div className="flex flex-col gap-5">
        <CardHeader className="p-0 gap-0">
        <CardTitle className="text-base leading-6">Quick Actions</CardTitle>
          <CardDescription className="text-sm">
            Helpful actions for the selected report.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 gap-4 flex flex-col">
          {/* Community support count */}
          <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-8 rounded-full bg-[#2b7fff]/10 text-[#2b7fff] flex items-center justify-center">
                <ThumbsUp className="size-4" />
              </span>
              <div className="leading-tight">
                <div className="font-semibold text-sm">{supportCount}</div>
                <div className="text-muted-foreground text-xs">
                  {supportCount === 1 ? "person supports" : "people support"} this
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-full h-10"
              disabled={disabled}
              onClick={onViewReport}
            >
              View Report
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10"
              disabled={disabled}
              onClick={onAddPhoto}
            >
              Add Photo
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-10"
              disabled={disabled}
              onClick={onShare}
            >
              Share
            </Button>
            {onAction ? (
              <Button
                variant="default"
                className="rounded-full h-10 bg-[#2b7fff] text-blue-50 hover:bg-[#2b7fff]/90"
                disabled={disabled}
                onClick={onAction}
              >
                {actionLabel ?? "Action"}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant={hasSupported ? "default" : "outline"}
                className={
                  "rounded-full h-10 " +
                  (hasSupported ? "bg-[#2b7fff] text-blue-50 hover:bg-[#2b7fff]/90" : "")
                }
                disabled={disabled || supporting || hasSupported}
                onClick={onSupport}
              >
                <ThumbsUp className="size-4 mr-1.5" />
                {hasSupported
                  ? "Supported"
                  : supporting
                    ? "Supporting…"
                    : `Support (${supportCount})`}
              </Button>
            )}
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <div className="font-medium text-sm leading-5">Reference ID</div>
            <div className="font-mono text-[#2b7fff] text-sm leading-5 mt-1">
              {issue ? shortId(issue.id) : "—"}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
