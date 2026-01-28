import express from "express";
import { getGridSettings } from "./settings.controller.js";
import { patchGridSettings } from "./settings.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/grid", authMiddleware, getGridSettings);
router.patch("/grid", authMiddleware, patchGridSettings);

export default router;
