import express from "express";
import {
  getRoutines,
  postRoutine,
  patchRoutine,
  deleteSelectedRoutines,
  deleteAllRoutinesController,
  getRoutineModal,
  snoozeRoutineModal,
  dismissRoutineModal,
} from "./routine.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, getRoutines);
router.post("/", authenticate, postRoutine);
router.patch("/:id", authenticate, patchRoutine);
router.delete("/all", authenticate, deleteAllRoutinesController);
router.delete("/", authenticate, deleteSelectedRoutines);
// 모달 전용
router.get("/modal", authenticate, getRoutineModal);
router.post("/:id/modal/snooze", authenticate, snoozeRoutineModal);
router.post("/:id/modal/dismiss", authenticate, dismissRoutineModal);

export default router;
