import express from "express";
import { authenticate } from "../auth/middlewares/auth.middleware.js";
import { patchCategoryOrders } from "./order.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Order
 *     description: 카테고리/낱말 순서 관리 API
 */

/**
 * @swagger
 * /api/order/categories:
 *   patch:
 *     summary: 낱말 카테고리 순서 변경
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - categoryId
 *                     - displayOrder
 *                   properties:
 *                     categoryId:
 *                       type: string
 *                       example: "uuid-string"
 *                     displayOrder:
 *                       type: integer
 *                       example: 1
 *     responses:
 *       200:
 *         description: 순서 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       example: 2
 *                     categoryOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           displayOrder:
 *                             type: integer
 *                 message:
 *                   type: string
 *                   example: 카테고리 순서 변경 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */

router.patch("/categories", authenticate, patchCategoryOrders);

export default router;
