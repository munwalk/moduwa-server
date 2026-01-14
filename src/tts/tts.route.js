import { Router } from "express";
import { tts } from "./tts.controller.js";

const router = Router();

// POST /tts
router.post("/", tts);

export default router;