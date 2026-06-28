import { User } from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import type { LeaderboardEntry } from "../../../lib";

interface LeaderboardTableProps {
  t: DashboardTheme;
  isDark: boolean;
  entries: LeaderboardEntry[];
  hasSearch: boolean;
}

const COLS = "grid grid-cols-[60px_1.4fr_90px_90px_120px] md:grid-cols-[80px_1.4fr_110px_110px_130px]";

export function LeaderboardTable({ t, isDark, entries, hasSearch }: LeaderboardTableProps) {
  return (
    <div
      className="rounded-3xl border p-6 grid gap-4"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-semibold text-xl" style={{ color: t.text }}>
            Leaderboard Table
          </div>
          <div className="text-sm" style={{ color: t.textSub }}>
            Citizens driving the highest civic impact.
          </div>
        </div>
        <span
          className="rounded-full text-xs font-medium px-2.5 py-1"
          style={{ background: t.tagBg, color: t.tagText }}
        >
          Live updates
        </span>
      </div>

      <div className="rounded-3xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
        <div
          className={`${COLS} font-medium uppercase text-xs tracking-wide px-5 py-3`}
          style={{ background: t.tagBg, color: t.tagText, borderBottom: `1px solid ${t.divider}` }}
        >
          <div>Rank</div>
          <div>Name</div>
          <div>Level</div>
          <div>Points</div>
          <div>Badge</div>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: t.textSub }}>
            {hasSearch ? "No citizens match your search." : "No citizens on the leaderboard yet."}
          </div>
        ) : (
          entries.map((e, i) => {
            const rowBg = e.isMe
              ? isDark
                ? "rgba(37,99,235,0.12)"
                : "#EFF6FF"
              : "transparent";
            return (
              <div
                key={e.id}
                className={`${COLS} px-5 py-4 items-center`}
                style={{
                  background: rowBg,
                  borderTop: i === 0 ? "none" : `1px solid ${t.divider}`,
                }}
              >
                <div className="font-semibold" style={{ color: e.rank <= 3 ? "#2563EB" : t.textSub }}>
                  #{e.rank}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-10 rounded-full flex justify-center items-center shrink-0 overflow-hidden"
                    style={{
                      background: e.isMe ? "#2563EB" : t.tagBg,
                      color: e.isMe ? "#EFF6FF" : t.textSub,
                    }}
                  >
                    {e.avatar ? <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" /> : <User className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate" style={{ color: t.text }}>
                      {e.name}
                      {e.isMe && <span style={{ color: "#2563EB" }}> (you)</span>}
                    </div>
                    <div className="text-sm truncate" style={{ color: t.textSub }}>
                      {e.resolved > 0 ? `${e.resolved} resolved` : `${e.reports} reports`}
                    </div>
                  </div>
                </div>
                <div className="font-medium text-sm" style={{ color: t.text }}>
                  Level {e.level}
                </div>
                <div className="font-medium text-sm" style={{ color: t.text }}>
                  {e.points.toLocaleString()}
                </div>
                <div>
                  <span
                    className="rounded-full text-xs font-medium px-2.5 py-1 inline-block"
                    style={{
                      background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)",
                      color: "#2563EB",
                    }}
                  >
                    {e.badge}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
