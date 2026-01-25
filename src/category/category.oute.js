import express from "express";
import {
  createCategory,
  patchCategory,
  removeCategory,
} from "./category.controller.js";

const router = express.Router();

// POST /api/categories
router.post("/", createCategory);

// PATCH /api/categories/:id
router.patch("/:id", patchCategory);

// DELETE /api/categories/:id
router.delete("/:id", removeCategory);

export default router;
