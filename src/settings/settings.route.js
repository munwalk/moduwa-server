import express from "express";
import { getGridSettings } from "./settings.controller.js";
import { patchGridSettings } from "./settings.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/grid", authenticate, getGridSettings);
router.patch("/grid", authenticate, patchGridSettings);

export default router;
