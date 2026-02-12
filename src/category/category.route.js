import express from "express";
import {
  getCategories,
  createCategory,
  patchCategory,
  removeCategory,
} from "./category.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: 낱말 카테고리 관리 API (기본 + 사용자 카테고리)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "22b9a172-a711-485d-a222-197aa74680f0"
 *         name:
 *           type: string
 *           example: "최근사용"
 *         iconKey:
 *           type: string
 *           nullable: true
 *           example: "ICON_RECENT"
 *         iconUrl:
 *           type: string
 *           nullable: true
 *           example: null
 *         displayOrder:
 *           type: integer
 *           example: 0
 *         wordCount:
 *           type: integer
 *           example: 3
 *
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *         - iconKey
 *       properties:
 *         name:
 *           type: string
 *           example: "내카테고리"
 *         iconKey:
 *           type: string
 *           example: "ICON_STAR"
 *         iconUrl:
 *           type: string
 *           nullable: true
 *           example: null
 *
 *     PatchCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "수정된카테고리"
 *         iconKey:
 *           type: string
 *           example: "ICON_HEART"
 *         iconUrl:
 *           type: string
 *           nullable: true
 *           example: null
 *         displayOrder:
 *           type: integer
 *           example: 1
 */
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 카테고리 목록 조회
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 카테고리 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryResponse'
 *                 message:
 *                   type: string
 *                   example: "카테고리 조회 성공"
 *       401:
 *         description: 인증 실패
 */
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: 사용자 카테고리 생성
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: 카테고리 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryResponse'
 *                 message:
 *                   type: string
 *                   example: "카테고리 생성 성공"
 *       409:
 *         description: 중복 카테고리명
 */
/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: 카테고리 수정 (이름, 아이콘 변경)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchCategoryRequest'
 *     responses:
 *       200:
 *         description: 카테고리 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryResponse'
 *                 message:
 *                   type: string
 *                   example: "카테고리 수정 성공"
 *       400:
 *         description: 기본 카테고리 이름 수정 불가
 *       404:
 *         description: 카테고리 없음
 */
/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: 카테고리 삭제
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 카테고리 삭제 성공
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
 *                     categoryId:
 *                       type: string
 *                       example: "cad66acd-577b-44fc-9de2-b497f271f319"
 *                     deletedWordCount:
 *                       type: integer
 *                       example: 5
 *                 message:
 *                   type: string
 *                   example: "카테고리 삭제 성공"
 *       400:
 *         description: 기본 카테고리는 삭제 불가
 *       404:
 *         description: 카테고리 없음
 */

router.use(authenticate);

// GET /api/categories
router.get("/", getCategories);

// POST /api/categories
router.post("/", createCategory);

// PATCH /api/categories/:id
router.patch("/:id", patchCategory);

// DELETE /api/categories/:id
router.delete("/:id", removeCategory);

export default router;
