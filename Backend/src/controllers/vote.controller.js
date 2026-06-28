// Vote & support controller.
// Votes = community upvotes. Supports = backing an existing issue instead of
// filing a duplicate (Feature 2).
import { z } from "zod";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

async function ensureIssue(id) {
  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) throw ApiError.notFound("Issue not found");
  return issue;
}

/**
 * POST /api/issues/:id/vote   — toggle an upvote.
 */
export const toggleVote = asyncHandler(async (req, res) => {
  await ensureIssue(req.params.id);

  const existing = await prisma.vote.findUnique({
    where: { issueId_userId: { issueId: req.params.id, userId: req.user.id } },
  });

  let voted;
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    voted = false;
  } else {
    await prisma.vote.create({
      data: { issueId: req.params.id, userId: req.user.id },
    });
    voted = true;
  }

  const count = await prisma.vote.count({ where: { issueId: req.params.id } });
  return sendSuccess(res, { voted, count }, voted ? "Vote added" : "Vote removed");
});

const supportSchema = z.object({ note: z.string().max(300).optional() });

/**
 * POST /api/issues/:id/support — back an existing issue (duplicate flow).
 */
export const supportIssue = asyncHandler(async (req, res) => {
  const { note } = supportSchema.parse(req.body ?? {});
  await ensureIssue(req.params.id);

  const existing = await prisma.support.findUnique({
    where: { issueId_userId: { issueId: req.params.id, userId: req.user.id } },
  });
  if (existing) throw ApiError.conflict("You already support this issue");

  await prisma.support.create({
    data: { issueId: req.params.id, userId: req.user.id, note },
  });

  // Also add a YES verification to increase verified count
  await prisma.verification.upsert({
    where: { issueId_userId: { issueId: req.params.id, userId: req.user.id } },
    update: { answer: "YES" },
    create: { issueId: req.params.id, userId: req.user.id, answer: "YES" },
  });

  const count = await prisma.support.count({ where: { issueId: req.params.id } });
  return sendCreated(res, { count }, "Support recorded");
});
