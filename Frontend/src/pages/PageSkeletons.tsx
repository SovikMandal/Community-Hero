// A single, simple loading indicator used across pages while data is fetching.
// (Replaced the previous shimmer skeletons with one static loader.)

function StaticLoader() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-24 animate-in fade-in">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-blue-200 border-t-blue-600 animate-spin"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm font-medium text-slate-400">Loading…</p>
    </div>
  );
}

// All pages share the same loader. The named exports are kept so existing
// imports/usages keep working without any changes at the call sites.
export function DashboardSkeleton() { return <StaticLoader />; }
export function CommunitySkeleton() { return <StaticLoader />; }
export function LeaderboardSkeleton() { return <StaticLoader />; }
export function AllIssuesSkeleton() { return <StaticLoader />; }
export function TrackIssueSkeleton() { return <StaticLoader />; }
