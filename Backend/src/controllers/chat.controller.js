// Chat controller (Feature 6): AI assistant grounded in optional issue context.
import { z } from "zod";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { chatReply } from "../services/ai.service.js";

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  issueId: z.string().optional(),
});

/**
 * POST /api/chat
 * Persists the user message + assistant reply, returns the reply.
 */
export const sendChat = asyncHandler(async (req, res) => {
  const { message, issueId } = chatSchema.parse(req.body);

  // Ground the reply in issue context when provided.
  let context = null;
  if (issueId) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: {
        title: true,
        category: true,
        status: true,
        priority: true,
        aiSummary: true,
        department: { select: { name: true } },
      },
    });
    if (issue) context = issue;
  }

  // Recent history for this user (last 10 messages, chronological).
  const history = (
    await prisma.chatMessage.findMany({
      where: { userId: req.user.id, issueId: issueId || null },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  ).reverse();

  const reply = await chatReply(message, history, context);

  // Persist both turns.
  await prisma.chatMessage.createMany({
    data: [
      { role: "USER", content: message, userId: req.user.id, issueId: issueId || null },
      { role: "ASSISTANT", content: reply, userId: req.user.id, issueId: issueId || null },
    ],
  });

  return sendSuccess(res, { reply }, "Chat reply");
});

/**
 * GET /api/chat/history
 */
export const getChatHistory = asyncHandler(async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return sendSuccess(res, { messages }, "Chat history");
});
