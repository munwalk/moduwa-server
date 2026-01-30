import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { patchCategoryOrders } from "./order.controller.js";

const router = express.Router();

router.patch("/categories", authMiddleware, patchCategoryOrders);

export default router;
