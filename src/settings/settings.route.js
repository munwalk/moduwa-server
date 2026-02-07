import express from "express";
import { getGridSettings, patchGridSettings } from "./settings.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Settings - 말하기 화면 설정 API
 *     description: 말하기 화면(그리드) 커스터마이징 설정 조회/수정 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GridSettings:
 *       type: object
 *       properties:
 *         gridColumns:
 *           type: integer
 *           description: "그리드 열 수 (3/4/7)"
 *           example: 4
 *
 *     GridSettingsUpdateRequest:
 *       type: object
 *       required: [gridColumns]
 *       properties:
 *         gridColumns:
 *           type: integer
 *           description: "허용값: 3 | 4 | 7"
 *           example: 7
 */

/**
 * @swagger
 * /api/settings/grid:
 *   get:
 *     tags: [Settings - 말하기 화면 설정 API]
 *     summary: 그리드 커스터마이징 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 그리드 커스터마이징 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/GridSettings"
 *                 message:
 *                   type: string
 *                   example: "그리드 커스터마이징 조회 성공"
 */
router.get("/grid", authenticate, getGridSettings);

/**
 * @swagger
 * /api/settings/grid:
 *   patch:
 *     tags: [Settings - 말하기 화면 설정 API]
 *     summary: 그리드 커스터마이징 수정
 *     description: "gridColumns는 3/4/7만 허용되며 upsert로 저장합니다."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/GridSettingsUpdateRequest"
 *     responses:
 *       200:
 *         description: 그리드 커스터마이징 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/GridSettings"
 *                 message:
 *                   type: string
 *                   example: "그리드 커스터마이징 수정 성공"
 *       400:
 *         description: 유효성 오류
 */
router.patch("/grid", authenticate, patchGridSettings);

export default router;
