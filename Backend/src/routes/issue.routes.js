import { Router } from "express";
import {
  createIssue,
  analyzeIssue,
  listIssues,
  getMapIssues,
  getIssue,
  getMyActivity,
  updateStatus,
} from "../controllers/issue.controller.js";
import { toggleVote, supportIssue } from "../controllers/vote.controller.js";
import { verifyIssue, getVerifications } from "../controllers/verification.controller.js";
import { listComments, addComment, addIssueImages, deleteIssueImage } from "../controllers/community.controller.js";
import { authenticate, authorize, optionalAuth } from "../middleware/auth.js";
import { uploadIssueMedia } from "../middleware/upload.js";

const router = Router();

// Public-ish reads (optionalAuth lets "mine" filter work when logged in).
router.get("/", optionalAuth, listIssues);
router.get("/map", getMapIssues);
// Signed-in user's own + merged reports' lifecycle timeline. Declared before
// "/:id" so "my-activity" isn't captured as an issue id.
router.get("/my-activity", authenticate, getMyActivity);
router.get("/:id", optionalAuth, getIssue);

// Preview the AI analysis without saving (multipart, optional image under "images").
router.post("/analyze", authenticate, uploadIssueMedia, analyzeIssue);

// Report a new issue (multipart with up to 5 media files under "images").
router.post("/", authenticate, uploadIssueMedia, createIssue);

// Status updates restricted to officers/admins (Feature 13).
router.patch("/:id/status", authenticate, authorize("OFFICER", "ADMIN"), updateStatus);

// Community engagement (Features 2, 7, 8).
router.post("/:id/vote", authenticate, toggleVote);
router.post("/:id/support", authenticate, supportIssue);
router.post("/:id/verify", authenticate, verifyIssue);
router.get("/:id/verifications", getVerifications);

// Community discussion + evidence (Community page).
router.get("/:id/comments", listComments);
router.post("/:id/comments", authenticate, addComment);
router.post("/:id/images", authenticate, uploadIssueMedia, addIssueImages);
router.delete("/:id/images/:imageId", authenticate, deleteIssueImage);

export default router;
