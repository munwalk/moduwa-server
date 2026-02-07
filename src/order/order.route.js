import express from "express";
import { authenticate } from "../auth/middlewares/auth.middleware.js";
import { patchCategoryOrders } from "./order.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Words - Category Order
 *     description: 낱말 카테고리 순서 변경 API
 */

/**
 * @swagger
 * /api/order/categories:
 *   patch:
 *     tags: [Words - Category Order]
 *     summary: 낱말 카테고리 순서 변경
 *     description: 카테고리 displayOrder를 일괄 변경합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orders]
 *             properties:
 *               orders:
 *                 type: array
 *                 description: 변경할 카테고리 순서 목록
 *                 items:
 *                   type: object
 *                   required: [id, displayOrder]
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c8a1f2c1-1234-4a5b-9d1e-0f3a9d2f1111"
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
 *                 message:
 *                   type: string
 *                   example: "카테고리 순서 변경 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                       example: 4
 *       400:
 *         description: 요청값 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

router.patch("/categories", authenticate, patchCategoryOrders);

export default router;
