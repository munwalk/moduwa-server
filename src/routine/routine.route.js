import express from "express";
import {
  getRoutines,
  postRoutine,
  patchRoutine,
  deleteSelectedRoutines,
  deleteAllRoutinesController,
} from "./routine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRoutines);
router.post("/", authMiddleware, postRoutine);
router.patch("/:id", authMiddleware, patchRoutine);
router.delete("/", authMiddleware, deleteSelectedRoutines);
router.delete("/all", authMiddleware, deleteAllRoutinesController);

export default router;
