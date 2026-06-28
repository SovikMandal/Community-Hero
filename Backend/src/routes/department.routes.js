import { Router } from "express";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

// GET /api/departments — list routing targets (Feature 5).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { issues: true } } },
    });
    return sendSuccess(res, { departments }, "Departments");
  })
);

export default router;
