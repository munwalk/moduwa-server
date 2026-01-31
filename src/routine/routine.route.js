import express from "express";
import {
  getRoutines,
  postRoutine,
  patchRoutine,
  deleteSelectedRoutines,
  deleteAllRoutinesController,
} from "./routine.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, getRoutines);
router.post("/", authenticate, postRoutine);
router.patch("/:id", authenticate, patchRoutine);
router.delete("/", authenticate, deleteSelectedRoutines);
router.delete("/all", authenticate, deleteAllRoutinesController);

export default router;
