import { Router } from "express";
import { sendChat, getChatHistory } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/", authenticate, sendChat);
router.get("/history", authenticate, getChatHistory);

export default router;
