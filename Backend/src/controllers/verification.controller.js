// Verification controller (Feature 8): nearby users confirm an issue is real.
import { z } from "zod";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendCreated, sendSuccess } from "../utils/response.js";
import { distanceMeters } from "../services/duplicate.service.js";

const verifySchema = z.object({
  answer: z.enum(["YES", "NO"]),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

// Number of YES verifications that auto-promotes REPORTED -> VERIFIED.
const VERIFY_THRESHOLD = 3;

// A verifier must be physically within this distance of the reported issue.
const MAX_VERIFY_DISTANCE_M = 2;

/**
 * POST /api/issues/:id/verify
 * Location-gated: the verifier's current coordinates must be within
 * MAX_VERIFY_DISTANCE_M of the reported issue.
 */
export const verifyIssue = asyncHandler(async (req, res) => {
  const { answer, latitude, longitude } = verifySchema.parse(req.body);

  const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
  if (!issue) throw ApiError.notFound("Issue not found");
  if (issue.reporterId === req.user.id) {
    throw ApiError.badRequest("You cannot verify your own report");
  }

  // Location check — must be on-site to verify.
  const distance = distanceMeters(latitude, longitude, issue.latitude, issue.longitude);
  if (distance > MAX_VERIFY_DISTANCE_M) {
    throw ApiError.badRequest(
      `Your location doesn't match the reported site (about ${Math.round(distance)}m away). ` +
        `Please verify within ${MAX_VERIFY_DISTANCE_M}m of the issue.`
    );
  }

  // Upsert so a user can change their answer.
  await prisma.verification.upsert({
    where: { issueId_userId: { issueId: req.params.id, userId: req.user.id } },
    update: { answer },
    create: { issueId: req.params.id, userId: req.user.id, answer },
  });

  const [yes, no] = await Promise.all([
    prisma.verification.count({ where: { issueId: req.params.id, answer: "YES" } }),
    prisma.verification.count({ where: { issueId: req.params.id, answer: "NO" } }),
  ]);

  // Auto-promote once enough citizens confirm.
  if (issue.status === "REPORTED" && yes >= VERIFY_THRESHOLD && yes > no) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: {
        status: "VERIFIED",
        timeline: {
          create: { status: "VERIFIED", note: `Community-verified (${yes} confirmations)` },
        },
      },
    });
  }

  return sendCreated(res, { yes, no, distance: Math.round(distance) }, "Verification recorded");
});

/**
 * GET /api/issues/:id/verifications — tally for an issue.
 */
export const getVerifications = asyncHandler(async (req, res) => {
  const [yes, no] = await Promise.all([
    prisma.verification.count({ where: { issueId: req.params.id, answer: "YES" } }),
    prisma.verification.count({ where: { issueId: req.params.id, answer: "NO" } }),
  ]);
  return sendSuccess(res, { yes, no }, "Verification tally");
});
