import express from "express";
import { getGridSettings } from "./settings.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/grid", authMiddleware, getGridSettings);

export default router;
