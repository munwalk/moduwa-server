import express from "express";
import { authenticate } from "../auth/middlewares/auth.middleware.js";
import { patchCategoryOrders } from "./order.controller.js";

const router = express.Router();

router.patch("/categories", authenticate, patchCategoryOrders);

export default router;
