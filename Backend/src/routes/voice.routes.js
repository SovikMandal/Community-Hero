import { Router } from "express";
import { transcribe } from "../controllers/voice.controller.js";
import { authenticate } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/upload.js";

const router = Router();

router.post("/transcribe", authenticate, uploadAudio, transcribe);

export default router;
