// Leaderboard ranking service.
//
// Single source of truth for civic-impact points and ranking, shared by the
// public dashboard leaderboard (Feature 9) and the admin report-contributors
// endpoint. Keeping the scoring here ensures both surfaces stay in sync.
import prisma from "../config/prisma.js";

// Status values that count as "verified or further along the pipeline".
const VERIFIED_OR_BEYOND = [
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
  "COMPLETED",
];

// Points awarded per civic action — drives the leaderboard ranking.
export const POINTS = {
  report: 50, // each issue reported
  verifiedReport: 30, // bonus when a reported issue gets verified
  resolvedReport: 50, // bonus when a reported issue is completed
  voteGiven: 5, // upvoting another issue
  supportGiven: 5, // supporting a duplicate
  verificationGiven: 10, // confirming a nearby issue
};

export const POINTS_PER_LEVEL = 500;

export function levelForPoints(points) {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

export function badgeForLevel(level) {
  if (level >= 12) return "City Champion";
  if (level >= 10) return "City Helper";
  if (level >= 7) return "Rising Star";
  if (level >= 5) return "Supporter";
  if (level >= 3) return "Contributor";
  return "Newcomer";
}

/**
 * Computes the full ranked leaderboard from real user activity.
 * Returns `{ entries, totalCommunityVerifications }` where `entries` is sorted
 * by points desc (ties broken by resolved then reports) with a 1-based `rank`.
 */
export async function computeRankedUsers() {
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      createdAt: true,
      issues: { select: { status: true } },
      _count: { select: { votes: true, supports: true, verifications: true } },
    },
  });

  let totalCommunityVerifications = 0;

  const computed = users.map((u) => {
    const reports = u.issues.length;
    const verified = u.issues.filter((i) => VERIFIED_OR_BEYOND.includes(i.status)).length;
    const resolved = u.issues.filter((i) => i.status === "COMPLETED").length;
    const votes = u._count.votes;
    const supports = u._count.supports;
    const verifications = u._count.verifications;

    totalCommunityVerifications += verifications;

    const points =
      reports * POINTS.report +
      verified * POINTS.verifiedReport +
      resolved * POINTS.resolvedReport +
      votes * POINTS.voteGiven +
      supports * POINTS.supportGiven +
      verifications * POINTS.verificationGiven;

    const level = levelForPoints(points);

    return {
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      reports,
      verified,
      resolved,
      verifications,
      points,
      level,
      badge: badgeForLevel(level),
    };
  });

  // Rank by points (desc), breaking ties by resolved then reports.
  computed.sort(
    (a, b) => b.points - a.points || b.resolved - a.resolved || b.reports - a.reports
  );

  const topPoints = computed[0]?.points || 0;
  const entries = computed.map((u, idx) => ({
    ...u,
    rank: idx + 1,
    impactScore: topPoints > 0 ? Math.round((u.points / topPoints) * 100) : 0,
  }));

  return { entries, totalCommunityVerifications };
}
