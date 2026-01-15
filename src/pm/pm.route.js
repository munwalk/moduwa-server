import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  createCategory,
  patchCategory,
  removeCategory,
} from "./pm.controller.js";

const router = express.Router();

// PM-02
router.post("/categories", authMiddleware, createCategory);
router.patch("/categories/:id", authMiddleware, patchCategory);
router.delete("/categories/:id", authMiddleware, removeCategory);

export default router;
