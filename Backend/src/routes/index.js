// Aggregates all feature routers under /api.
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import issueRoutes from "./issue.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import chatRoutes from "./chat.routes.js";
import voiceRoutes from "./voice.routes.js";
import departmentRoutes from "./department.routes.js";
import communityRoutes from "./community.routes.js";
import otpRoutes from "./otp.routes.js";
import adminRoutes from "../admin/admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/issues", issueRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/chat", chatRoutes);
router.use("/voice", voiceRoutes);
router.use("/departments", departmentRoutes);
router.use("/community", communityRoutes);
router.use("/otp", otpRoutes);
router.use("/admin", adminRoutes);

export default router;
