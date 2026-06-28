import { statusLabel, timeAgo, type Issue } from "../../../lib";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

interface TimelineCardProps {
  issue: Issue | null;
  loading: boolean;
}

export function TimelineCard({ issue, loading }: TimelineCardProps) {
  // Newest first.
  const events = [...(issue?.timeline ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card className="shadow-sm rounded-3xl border-border border border-solid p-5 gap-4">
      <CardHeader className="p-0 gap-0">
        <CardTitle className="text-base leading-6">Timeline</CardTitle>
        <CardDescription className="text-sm">Recent updates from the city team.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 gap-3">
        {!issue ? (
          <div className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            {loading ? "Loading timeline…" : "Select a report to view its timeline."}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
            No updates recorded yet.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-card border-border border border-solid p-4"
            >
              <div className="flex justify-between items-center gap-3">
                <div className="font-medium text-sm leading-5">
                  {statusLabel(event.status)}
                </div>
                <div className="text-muted-foreground text-xs leading-4 shrink-0">
                  {timeAgo(event.createdAt)}
                </div>
              </div>
              {event.note && (
                <div className="text-muted-foreground text-sm leading-5 mt-2">
                  {event.note}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
