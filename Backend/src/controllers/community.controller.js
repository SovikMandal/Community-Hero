// Community controller: powers the Community verification feed.
// - GET  /api/community/reports        — issues open for community verification
// - GET  /api/issues/:id/comments      — discussion thread for an issue
// - POST /api/issues/:id/comments      — add a comment
// - POST /api/issues/:id/images        — attach evidence photos to an issue
import { z } from "zod";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import { uploadMany, isCloudinaryConfigured, deleteAsset } from "../services/cloudinary.service.js";

// Issues in these states are still worth verifying / discussing.
const ACTIVE_STATUSES = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
];

const COMMENT_INCLUDE = {
  user: { select: { id: true, name: true, avatar: true } },
};

/**
 * Derives a display "AI confidence" (0–100) for a report.
 *
 * NOTE: the AI pipeline does not persist a raw model-confidence value, so this
 * is a deterministic heuristic built from real, stored signals:
 *   • priorityScore (0–100, computed by the priority engine)
 *   • whether the image was actually analysed by the AI (aiSummary present)
 * It is intentionally clamped to a believable 55–99 range.
 */
function deriveAiConfidence(issue) {
  const base = 55 + (issue.priorityScore ?? 0) * 0.4; // 55 → 95
  const analysedBonus = issue.aiSummary ? 4 : 0; // AI actually looked at it
  return Math.round(Math.min(99, Math.max(55, base + analysedBonus)));
}

/**
 * GET /api/community/reports
 * Returns active issues with verification tallies, derived AI confidence,
 * a community-agreement percentage, and the latest comments. optionalAuth so
 * the signed-in user's own verification answer can be surfaced.
 */
export const getCommunityReports = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
  const search = (req.query.q || "").toString().trim();

  const where = { status: { in: ACTIVE_STATUSES } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { createdAt: "asc" } },
        reporter: { select: { id: true, name: true } },
        verifications: { select: { answer: true, userId: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          take: 20,
          include: COMMENT_INCLUDE,
        },
        _count: { select: { comments: true, verifications: true, supports: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);

  const meId = req.user?.id || null;

  const reports = issues.map((issue) => {
    const yes = issue.verifications.filter((v) => v.answer === "YES").length + (issue._count?.supports ?? 0);
    const no = issue.verifications.filter((v) => v.answer === "NO").length;
    const mine = meId
      ? issue.verifications.find((v) => v.userId === meId)?.answer ?? null
      : null;

    return {
      id: issue.id,
      title: issue.title,
      category: issue.category,
      status: issue.status,
      location: issue.address || `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`,
      image: issue.images[0]?.url ?? null,
      images: issue.images.map((img) => ({
        id: img.id,
        url: img.url,
        isVideo: img.isVideo,
        canDelete: meId ? img.uploadedById === meId : false,
      })),
      aiConfidence: deriveAiConfidence(issue),
      // ((yes - no) / (yes + no)) * 100, never below 0; 0 when there are no votes.
      communityConfidence:
        yes + no > 0 ? Math.max(0, Math.round(((yes - no) / (yes + no)) * 100)) : 0,
      verifiedCount: yes + (issue._count?.supports ?? 0),
      yes,
      no,
      verifiedByMe: mine,
      isMine: meId ? issue.reporterId === meId : false,
      reporterId: issue.reporterId,
      reporterName: issue.reporter?.name ?? "Anonymous",
      commentCount: issue._count.comments,
      comments: issue.comments.map((c) => ({
        id: c.id,
        content: c.content,
        user: c.user ? { id: c.user.id, name: c.user.name, avatar: c.user.avatar } : null,
        createdAt: c.createdAt,
      })),
      createdAt: issue.createdAt,
    };
  });

  return sendPaginated(res, reports, { page, limit, total }, "Community reports");
});

async function ensureIssue(id) {
  const issue = await prisma.issue.findUnique({ where: { id }, select: { id: true } });
  if (!issue) throw ApiError.notFound("Issue not found");
  return issue;
}

/**
 * GET /api/issues/:id/comments
 */
export const listComments = asyncHandler(async (req, res) => {
  await ensureIssue(req.params.id);
  const comments = await prisma.comment.findMany({
    where: { issueId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: COMMENT_INCLUDE,
  });
  return sendSuccess(res, { comments }, "Comments");
});

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(500),
});

/**
 * POST /api/issues/:id/comments
 */
export const addComment = asyncHandler(async (req, res) => {
  const { content } = commentSchema.parse(req.body);
  await ensureIssue(req.params.id);

  const comment = await prisma.comment.create({
    data: { content, issueId: req.params.id, userId: req.user.id },
    include: COMMENT_INCLUDE,
  });

  return sendCreated(res, { comment }, "Comment added");
});

/**
 * POST /api/issues/:id/images
 * Attaches evidence photos/videos (multipart "images", up to 5) to an issue.
 */
export const addIssueImages = asyncHandler(async (req, res) => {
  await ensureIssue(req.params.id);

  const files = req.files || [];
  if (files.length === 0) throw ApiError.badRequest("No files provided (field name: images)");
  if (!isCloudinaryConfigured) {
    throw ApiError.badRequest("Image uploads are unavailable (Cloudinary not configured)");
  }

  const uploaded = await uploadMany(files);

  await prisma.issueImage.createMany({
    data: uploaded.map((u) => ({
      url: u.url,
      publicId: u.publicId,
      isVideo: u.isVideo,
      issueId: req.params.id,
      uploadedById: req.user.id,
    })),
  });

  const images = await prisma.issueImage.findMany({
    where: { issueId: req.params.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, isVideo: true, uploadedById: true },
  });

  return sendCreated(
    res,
    {
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        isVideo: img.isVideo,
        canDelete: img.uploadedById === req.user.id,
      })),
    },
    "Evidence added"
  );
});

/**
 * DELETE /api/issues/:id/images/:imageId
 * Removes a photo from Cloudinary + the DB. Only the uploader (or an admin)
 * may delete a given image.
 */
export const deleteIssueImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const image = await prisma.issueImage.findUnique({ where: { id: imageId } });
  if (!image || image.issueId !== id) throw ApiError.notFound("Photo not found");

  const isOwner = image.uploadedById && image.uploadedById === req.user.id;
  const isAdmin = req.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You can only delete photos you uploaded");
  }

  // Best-effort Cloudinary cleanup (don't block deletion if it fails).
  if (image.publicId) {
    try {
      await deleteAsset(image.publicId, { isVideo: image.isVideo });
    } catch (err) {
      console.error("[community] Cloudinary delete failed:", err.message);
    }
  }

  await prisma.issueImage.delete({ where: { id: imageId } });

  const images = await prisma.issueImage.findMany({
    where: { issueId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, url: true, isVideo: true, uploadedById: true },
  });

  return sendSuccess(
    res,
    {
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        isVideo: img.isVideo,
        canDelete: img.uploadedById === req.user.id,
      })),
    },
    "Photo deleted"
  );
});
