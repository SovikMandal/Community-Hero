// Dashboard controller (Feature 9): impact metrics + hotspots.
// Also exposes a predictive insight endpoint (Feature 10).
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { predictHotspot } from "../services/ai.service.js";
import { computeRankedUsers, POINTS_PER_LEVEL } from "../services/leaderboard.service.js";

/**
 * GET /api/dashboard/stats
 * Total complaints, resolved %, avg resolution time, common issue,
 * hotspots, and department performance.
 */
export const getStats = asyncHandler(async (req, res) => {
  // Platform-wide metrics (not scoped to the signed-in user) so the headline
  // KPI cards stay consistent with the global Issue Pipeline beside them.
  // REJECTED issues are excluded so the resolution rate isn't diluted by them.
  const where = { status: { not: "REJECTED" } };
  const whereCompleted = { status: "COMPLETED" };

  const [total, resolved, byCategory, byDepartment, completedIssues] =
    await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.count({ where: whereCompleted }),
      prisma.issue.groupBy({
        by: ["category"],
        where,
        _count: { _all: true },
        orderBy: { _count: { category: "desc" } },
      }),
      prisma.issue.groupBy({
        by: ["departmentId"],
        where,
        _count: { _all: true },
      }),
      prisma.issue.findMany({
        where: whereCompleted,
        select: { createdAt: true, updatedAt: true },
      }),
    ]);

  const rejected = await prisma.issue.count({ where: { status: "REJECTED" } });

  // Average resolution time (ms -> hours) across completed issues.
  let avgResolutionHours = null;
  if (completedIssues.length > 0) {
    const totalMs = completedIssues.reduce(
      (sum, i) => sum + (i.updatedAt.getTime() - i.createdAt.getTime()),
      0
    );
    avgResolutionHours =
      Math.round((totalMs / completedIssues.length / 36e5) * 10) / 10;
  }

  const mostCommon = byCategory[0]?.category || null;
  const resolvedRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;

  // Resolve department names for performance breakdown.
  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const departmentPerformance = byDepartment.map((d) => ({
    department: d.departmentId ? deptMap[d.departmentId] || "Unknown" : "Unassigned",
    total: d._count._all,
  }));

  return sendSuccess(
    res,
    {
      totalComplaints: total,
      resolved,
      rejected,
      resolvedRate, // percent
      avgResolutionHours,
      mostCommonIssue: mostCommon,
      categoryBreakdown: byCategory.map((c) => ({
        category: c.category,
        count: c._count._all,
      })),
      departmentPerformance,
    },
    "Dashboard stats"
  );
});

/**
 * GET /api/dashboard/leaderboard
 * Ranks users by civic-impact points derived from their real activity
 * (reports filed, verifications, votes, supports, and resolutions).
 * Uses optionalAuth so the signed-in user's own row can be flagged.
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { entries: ranked, totalCommunityVerifications } = await computeRankedUsers();

  const meId = req.user?.id || null;
  const entries = ranked.map((u) => ({ ...u, isMe: u.id === meId }));

  // Build the "me" payload with level-progress details for the rank card.
  let me = null;
  const meEntry = entries.find((e) => e.isMe);
  if (meEntry) {
    const levelFloor = (meEntry.level - 1) * POINTS_PER_LEVEL;
    const intoLevel = meEntry.points - levelFloor;
    const levelProgress = Math.round((intoLevel / POINTS_PER_LEVEL) * 100);
    me = {
      ...meEntry,
      pointsToNextLevel: Math.max(0, POINTS_PER_LEVEL - intoLevel),
      levelProgress,
    };
  }

  return sendSuccess(
    res,
    {
      entries,
      me,
      totalCitizens: entries.length,
      community: { verifications: totalCommunityVerifications },
    },
    "Leaderboard"
  );
});

/**
 * GET /api/dashboard/hotspots
 * Groups open issues into coarse geo-buckets to surface concentration areas.
 */
export const getHotspots = asyncHandler(async (_req, res) => {
  const issues = await prisma.issue.findMany({
    where: { status: { notIn: ["COMPLETED", "REJECTED"] } },
    select: { latitude: true, longitude: true, category: true },
  });

  // Bucket to ~0.01 degree (~1.1km) grid.
  const buckets = new Map();
  for (const i of issues) {
    const key = `${i.latitude.toFixed(2)},${i.longitude.toFixed(2)}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        latitude: Number(i.latitude.toFixed(2)),
        longitude: Number(i.longitude.toFixed(2)),
        count: 0,
        categories: {},
      });
    }
    const b = buckets.get(key);
    b.count += 1;
    b.categories[i.category] = (b.categories[i.category] || 0) + 1;
  }

  const hotspots = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 20);
  return sendSuccess(res, { hotspots }, "Hotspots");
});

/**
 * GET /api/dashboard/predict
 * AI prediction over the densest current hotspot (Feature 10).
 */
export const getPrediction = asyncHandler(async (_req, res) => {
  const recent = await prisma.issue.findMany({
    where: { status: { notIn: ["COMPLETED", "REJECTED"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { category: true, severity: true, address: true },
  });

  const result = await predictHotspot(recent);
  return sendSuccess(res, result, "Prediction");
});
