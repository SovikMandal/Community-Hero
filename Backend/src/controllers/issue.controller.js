// Issue controller: report, list, map, detail, status updates.
// Orchestrates AI analysis, duplicate detection, priority scoring, and routing.
import { z } from "zod";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated, sendSuccess, sendPaginated } from "../utils/response.js";
import { uploadMany, isCloudinaryConfigured } from "../services/cloudinary.service.js";
import {
  analyzeIssueImage,
  summarizeDescription,
  suggestDepartment,
} from "../services/ai.service.js";
import { computePriority } from "../services/priority.service.js";
import { findDuplicates } from "../services/duplicate.service.js";

const ISSUE_INCLUDE = {
  images: true,
  reporter: { select: { id: true, name: true, avatar: true } },
  department: { select: { id: true, name: true } },
  _count: { select: { votes: true, supports: true, verifications: true } },
};

const createSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(1).max(2000),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(255).optional(),
  category: z.string().optional(), // citizen hint; AI may override
  trafficLevel: z.coerce.number().min(0).max(5).optional(),
  peopleAffected: z.coerce.number().min(0).optional(),
  schoolNearby: z.coerce.boolean().optional(),
  hospitalNearby: z.coerce.boolean().optional(),
  forceCreate: z.coerce.boolean().optional(), // skip duplicate short-circuit
});

/**
 * POST /api/issues
 * Reports a new issue. Runs the full AI pipeline.
 */
export const createIssue = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const files = req.files || [];

  // --- Feature 1 + 12: AI image understanding & emergency detection ---
  let analysis = null;
  const primaryImage = files[0];
  if (primaryImage) {
    analysis = await analyzeIssueImage(
      primaryImage.buffer,
      primaryImage.mimetype,
      data.description
    );
  }

  const category =
    analysis?.category ||
    (data.category ? data.category.toUpperCase() : "OTHER");

  // --- Feature 2: Duplicate detection (unless caller forces creation) ---
  if (!data.forceCreate) {
    const duplicates = await findDuplicates({
      category,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    if (duplicates.length > 0) {
      const top = duplicates[0];
      return res.status(409).json({
        success: false,
        message: "A similar issue already exists nearby. Support it instead of creating a duplicate.",
        duplicate: {
          issue: top.issue,
          distanceMeters: Math.round(top.distance),
        },
        hint: "Resend with forceCreate=true to report anyway, or POST /api/issues/:id/support.",
      });
    }
  }

  // --- Feature 4: AI summary ---
  const aiSummary = await summarizeDescription(data.description);

  // --- Feature 3: Priority scoring ---
  const severity = analysis?.severity || "MEDIUM";
  const isEmergency = analysis?.isEmergency || false;
  const { score, level } = computePriority({
    severity,
    trafficLevel: data.trafficLevel ?? 0,
    peopleAffected: data.peopleAffected ?? 0,
    schoolNearby: data.schoolNearby ?? false,
    hospitalNearby: data.hospitalNearby ?? false,
    isEmergency,
  });

  // --- Feature 5: Department routing ---
  const departmentName = suggestDepartment(category);
  const department = await prisma.department.findUnique({
    where: { name: departmentName },
  });

  // --- Upload media to Cloudinary (best-effort) ---
  let uploaded = [];
  if (files.length > 0 && isCloudinaryConfigured) {
    try {
      uploaded = await uploadMany(files);
    } catch (err) {
      console.error("[issue] media upload failed:", err.message);
    }
  }

  // --- Persist issue + initial timeline event in one transaction ---
  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      aiSummary,
      estimatedDiameter: analysis?.estimatedDiameter,
      category,
      severity,
      risk: analysis?.risk || "MEDIUM",
      priorityScore: score,
      priority: level,
      isEmergency,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      trafficLevel: data.trafficLevel ?? 0,
      peopleAffected: data.peopleAffected ?? 0,
      schoolNearby: data.schoolNearby ?? false,
      hospitalNearby: data.hospitalNearby ?? false,
      reporterId: req.user.id,
      departmentId: department?.id,
      images: {
        create: uploaded.map((u) => ({
          url: u.url,
          publicId: u.publicId,
          isVideo: u.isVideo,
          uploadedById: req.user.id,
        })),
      },
      timeline: {
        create: { status: "REPORTED", note: "Issue reported", actorId: req.user.id },
      },
    },
    include: ISSUE_INCLUDE,
  });

  return sendCreated(res, { issue, analysis }, "Issue reported successfully");
});

const analyzeSchema = z.object({
  description: z.string().min(1).max(2000),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  category: z.string().optional(),
  trafficLevel: z.coerce.number().min(0).max(5).optional(),
  peopleAffected: z.coerce.number().min(0).optional(),
  schoolNearby: z.coerce.boolean().optional(),
  hospitalNearby: z.coerce.boolean().optional(),
});

/**
 * POST /api/issues/analyze
 * Runs the full AI pipeline (image analysis, duplicate detection, priority,
 * department routing, summary) WITHOUT persisting anything. Lets the client
 * preview the analysis before the citizen commits to creating the report.
 */
export const analyzeIssue = asyncHandler(async (req, res) => {
  const data = analyzeSchema.parse(req.body);
  const files = req.files || [];

  // Feature 1 + 12: image understanding & emergency detection.
  let analysis = null;
  const primaryImage = files[0];
  if (primaryImage) {
    analysis = await analyzeIssueImage(
      primaryImage.buffer,
      primaryImage.mimetype,
      data.description
    );
  }

  const category =
    analysis?.category ||
    (data.category ? data.category.toUpperCase() : "OTHER");
  const severity = analysis?.severity || "MEDIUM";
  const isEmergency = analysis?.isEmergency || false;

  // Feature 3: priority scoring.
  const { score, level } = computePriority({
    severity,
    trafficLevel: data.trafficLevel ?? 0,
    peopleAffected: data.peopleAffected ?? 0,
    schoolNearby: data.schoolNearby ?? false,
    hospitalNearby: data.hospitalNearby ?? false,
    isEmergency,
  });

  // Feature 5: department routing.
  const departmentName = suggestDepartment(category);

  // Feature 2: duplicate detection (read-only).
  const duplicates = await findDuplicates({
    category,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  // Feature 4: AI summary.
  const aiSummary = analysis?.summary || await summarizeDescription(data.description);

  return sendSuccess(
    res,
    {
      category,
      severity,
      risk: analysis?.risk || "MEDIUM",
      isEmergency,
      estimatedDiameter: analysis?.estimatedDiameter || null,
      summary: aiSummary,
      priorityScore: score,
      priority: level,
      department: departmentName,
      aiAvailable: !!(analysis && !analysis.fallback),
      duplicates: duplicates.map((d) => ({
        issue: d.issue,
        distanceMeters: Math.round(d.distance),
      })),
      aiAvailable: !analysis?.fallback,
    },
    "Analysis complete"
  );
});

/**
 * GET /api/issues
 * Lists issues with optional filters + pagination.
 */
export const listIssues = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  const where = {};
  if (req.query.category) where.category = String(req.query.category).toUpperCase();
  if (req.query.status) where.status = String(req.query.status).toUpperCase();
  if (req.query.priority) where.priority = String(req.query.priority).toUpperCase();
  if (req.query.departmentId) where.departmentId = String(req.query.departmentId);

  // "mine" returns reports the user created AND reports they merged into (a
  // duplicate they supported), so the All Reports page can show both.
  const mine = req.query.mine === "true" && !!req.user;
  if (mine) {
    where.OR = [
      { reporterId: req.user.id },
      { supports: { some: { userId: req.user.id } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        ...ISSUE_INCLUDE,
        verifications: { where: { answer: "YES" }, select: { id: true } },
      },
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  const result = items.map(({ verifications, ...issue }) => ({
    ...issue,
    citizenCount: (verifications?.length ?? 0) + (issue._count?.supports ?? 0),
    // On the "mine" view, flag whether the user created this report or merged
    // a duplicate into it.
    ...(mine ? { myReportType: issue.reporterId === req.user.id ? "created" : "merged" } : {}),
  }));

  return sendPaginated(res, result, { page, limit, total });
});

/**
 * GET /api/issues/map
 * Lightweight payload for map markers (Feature 7).
 */
export const getMapIssues = asyncHandler(async (req, res) => {
  const issues = await prisma.issue.findMany({
    where: { status: { not: "REJECTED" } },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      priority: true,
      isEmergency: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      reporterId: true,
      reporter: { select: { name: true } },
      _count: { select: { votes: true } },
    },
  });
  return sendSuccess(res, { issues }, "Map issues");
});

/**
 * GET /api/issues/:id
 * Full detail including timeline (Feature 13).
 */
export const getIssue = asyncHandler(async (req, res) => {
  const issue = await prisma.issue.findUnique({
    where: { id: req.params.id },
    include: {
      ...ISSUE_INCLUDE,
      timeline: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });
  if (!issue) throw ApiError.notFound("Issue not found");

  // Tell the current user whether they've already supported/voted this issue.
  if (req.user) {
    const [support, vote] = await Promise.all([
      prisma.support.findUnique({
        where: { issueId_userId: { issueId: issue.id, userId: req.user.id } },
      }),
      prisma.vote.findUnique({
        where: { issueId_userId: { issueId: issue.id, userId: req.user.id } },
      }),
    ]);
    issue.supportedByMe = Boolean(support);
    issue.votedByMe = Boolean(vote);
  } else {
    issue.supportedByMe = false;
    issue.votedByMe = false;
  }

  return sendSuccess(res, { issue }, "Issue detail");
});

/**
 * GET /api/issues/my-activity
 * Paginated lifecycle timeline across the reports the signed-in user created
 * OR merged a duplicate into (supported). Newest events first.
 */
export const getMyActivity = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

  // Issues the user created or merged into (via a Support).
  const myIssues = await prisma.issue.findMany({
    where: {
      OR: [
        { reporterId: req.user.id },
        { supports: { some: { userId: req.user.id } } },
      ],
    },
    select: { id: true, reporterId: true },
  });

  // Map each issue to how the user is related to it.
  const relation = new Map(
    myIssues.map((i) => [i.id, i.reporterId === req.user.id ? "created" : "merged"])
  );
  const issueIds = myIssues.map((i) => i.id);
  const where = { issueId: { in: issueIds } };

  const [events, total] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        issue: {
          select: { id: true, title: true, department: { select: { name: true } } },
        },
      },
    }),
    prisma.timelineEvent.count({ where }),
  ]);

  const items = events.map((e) => ({
    id: e.id,
    status: e.status,
    note: e.note ?? null,
    createdAt: e.createdAt,
    issueId: e.issue?.id ?? null,
    issueTitle: e.issue?.title ?? "Report",
    department: e.issue?.department?.name ?? null,
    reportType: relation.get(e.issueId) ?? "created",
  }));

  return sendPaginated(res, items, { page, limit, total }, "My activity");
});

const statusSchema = z.object({
  status: z.enum([
    "REPORTED",
    "ACCEPTED",
    "VERIFIED",
    "ASSIGNED",
    "ENGINEER_VISITED",
    "REPAIR_STARTED",
    "COMPLETED",
    "REJECTED",
  ]),
  note: z.string().max(500).optional(),
});

/**
 * PATCH /api/issues/:id/status
 * Officer/Admin updates status; appends a timeline event (Feature 13).
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = statusSchema.parse(req.body);

  const existing = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Issue not found");

  const issue = await prisma.issue.update({
    where: { id: req.params.id },
    data: {
      status,
      timeline: {
        create: { status, note: note || `Status changed to ${status}`, actorId: req.user.id },
      },
    },
    include: ISSUE_INCLUDE,
  });

  return sendSuccess(res, { issue }, "Status updated");
});
