import express from "express";
import { getRoutines, postRoutine } from "./routine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   GET /api/routines
 * @desc    PM05 루틴 문장 목록 조회
 * @access  Private (Bearer)
 */
router.get("/", authMiddleware, getRoutines);
router.post("/", authMiddleware, postRoutine);

export default router;
