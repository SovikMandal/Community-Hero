import { Router } from "express";
import { getCommunityReports } from "../controllers/community.controller.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Public feed (optionalAuth surfaces the signed-in user's own verification answer).
router.get("/reports", optionalAuth, getCommunityReports);

export default router;
