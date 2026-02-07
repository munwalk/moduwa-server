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
 *   - name: Words - Categories
 *     description: 낱말 카테고리 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "c8a1f2c1-1234-4a5b-9d1e-0f3a9d2f1111"
 *         categoryName:
 *           type: string
 *           example: "감정"
 *         displayOrder:
 *           type: integer
 *           example: 1
 *         iconKey:
 *           type: string
 *           nullable: true
 *           example: "icon-smile"
 *         iconUrl:
 *           type: string
 *           nullable: true
 *           example: "https://cdn.example.com/icon.png"
 *
 *     ApiResponseCategories:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "낱말 카테고리 조회 성공"
 *         data:
 *           type: object
 *           properties:
 *             categories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *
 *     ApiResponseCategory:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "낱말 카테고리 생성 성공"
 *         data:
 *           type: object
 *           properties:
 *             category:
 *               $ref: '#/components/schemas/Category'
 *
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "BAD_REQUEST"
 *             message:
 *               type: string
 *               example: "categoryName은 필수입니다."
 *             detail:
 *               nullable: true
 *               example: null
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Words - Categories]
 *     summary: 낱말 카테고리 목록 조회
 *     description: 사용자(또는 기본) 낱말 카테고리 목록을 조회합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseCategories'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Words - Categories]
 *     summary: 낱말 카테고리 생성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryName]
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: "운동"
 *               iconKey:
 *                 type: string
 *                 nullable: true
 *                 example: "icon-run"
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://cdn.example.com/run.png"
 *     responses:
 *       201:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseCategory'
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

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     tags: [Words - Categories]
 *     summary: 낱말 카테고리 수정
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
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *                 example: "일상"
 *               iconKey:
 *                 type: string
 *                 nullable: true
 *                 example: "icon-home"
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://cdn.example.com/home.png"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseCategory'
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
 *       404:
 *         description: 대상 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags: [Words - Categories]
 *     summary: 낱말 카테고리 삭제
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
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
 *                   example: "낱말 카테고리 삭제 성공"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c8a1f2c1-1234-4a5b-9d1e-0f3a9d2f1111"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: 대상 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
