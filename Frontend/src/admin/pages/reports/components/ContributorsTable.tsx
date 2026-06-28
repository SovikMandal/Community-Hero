import { FileText, GitMerge, User as UserIcon } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { IssueContributor } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** Report creator + everyone who merged a duplicate, with leaderboard stats. */
export function ContributorsTable({
  t,
  surface,
  contributors,
}: {
  t: DashboardTheme;
  surface: Surface;
  contributors: IssueContributor[];
}) {
  return (
    <div className="rounded-2xl border p-4 mt-4" style={{ background: surface.timelineBg, borderColor: t.inputBorder }}>
      <div className="font-medium text-sm flex items-center gap-2 mb-3" style={{ color: t.text }}>
        <UserIcon className="w-4 h-4 text-blue-500" /> User details
        {contributors.length > 0 && (
          <span className="text-xs font-normal" style={{ color: t.textSub }}>({contributors.length})</span>
        )}
      </div>

      {contributors.length === 0 ? (
        <div className="rounded-xl px-4 py-6 text-center text-sm" style={{ background: surface.innerBg, color: t.textSub }}>
          No contributor details available for this report.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border" style={{ borderColor: t.inputBorder }}>
          <table className="w-full text-left text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: surface.innerBg }}>
                {["#", "ID Number", "Name", "Email", "Type", "Rank", "Points"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: t.textSub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributors.map((c) => {
                const merged = c.type === "merged";
                return (
                  <tr key={c.userId} className="border-t" style={{ borderColor: t.inputBorder }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: t.text }}>{c.index}</td>
                    <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: t.textSub }}>{c.userId}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.name}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: t.textSub }}>{c.email}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                        style={{
                          background: merged ? "rgba(217,119,6,0.12)" : "rgba(37,99,235,0.12)",
                          color: merged ? "#D97706" : "#2563EB",
                        }}
                      >
                        {merged ? <GitMerge className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {merged ? "merged" : "created"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.rank != null ? `#${c.rank}` : "—"}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap" style={{ color: t.text }}>{c.points.toLocaleString()} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
