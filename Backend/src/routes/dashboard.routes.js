import { Router } from "express";
import {
  getStats,
  getHotspots,
  getPrediction,
  getLeaderboard,
} from "../controllers/dashboard.controller.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/stats", optionalAuth, getStats);
router.get("/hotspots", getHotspots);
router.get("/predict", getPrediction);
router.get("/leaderboard", optionalAuth, getLeaderboard);

export default router;
