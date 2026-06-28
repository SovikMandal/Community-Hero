import { Router } from "express";
import { sendOtpHandler, verifyOtpHandler } from "../controllers/otp.controller.js";

const router = Router();

router.post("/send", sendOtpHandler);
router.post("/verify", verifyOtpHandler);

export default router;
