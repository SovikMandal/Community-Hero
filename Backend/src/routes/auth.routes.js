import { Router } from "express";
import { register, login, refresh, logoutUser, me, updateAvatar, forgotPassword, resetPassword, googleStart, googleCallback } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { uploadAvatarImage } from "../middleware/upload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
// Google OAuth 2.0 (authorization-code flow): /google starts the redirect,
// /google/callback handles Google's redirect back.
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, me);
router.patch("/avatar", authenticate, uploadAvatarImage, updateAvatar);

export default router;
