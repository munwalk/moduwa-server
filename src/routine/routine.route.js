import express from "express";
import {
  getRoutines,
  postRoutine,
  patchRoutine,
} from "./routine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRoutines);
router.post("/", authMiddleware, postRoutine);
router.patch("/:id", authMiddleware, patchRoutine);

export default router;
