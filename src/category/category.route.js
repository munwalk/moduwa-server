import express from "express";
import {
  createCategory,
  patchCategory,
  removeCategory,
} from "./category.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/pm/categories:
 *   post:
 *     tags: [Category]
 *     summary: PM02 낱말 카테고리 생성
 *     description: |
 *       사용자 정의 낱말 카테고리를 생성합니다.
 *       iconKey 또는 iconUrl 중 하나는 반드시 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 즐겨찾기
 *               iconKey:
 *                 type: string
 *                 nullable: true
 *                 example: ICON_STAR
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: 카테고리 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: uuid
 *                 name: 즐겨찾기
 *                 iconKey: ICON_STAR
 *                 iconUrl: null
 *                 displayOrder: 4
 *                 wordCount: 0
 *               message: 카테고리 생성 성공
 *       400:
 *         description: 잘못된 요청 (필수 값 누락 또는 형식 오류)
 *       401:
 *         description: 인증 실패
 *       409:
 *         description: 중복된 카테고리 이름
 */

/**
 * @swagger
 * /api/pm/categories/{id}:
 *   patch:
 *     tags: [Category]
 *     summary: PM02 낱말 카테고리 수정
 *     description: |
 *       낱말 카테고리의 이름 또는 아이콘을 수정합니다.
 *       아이콘을 수정하는 경우 iconKey 또는 iconUrl 중 하나는 반드시 필요합니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 수정할 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 최근사용
 *               iconKey:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               iconUrl:
 *                 type: string
 *                 nullable: true
 *                 example: https://cdn.example.com/icons/my.png
 *     responses:
 *       200:
 *         description: 카테고리 수정 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id: uuid
 *                 name: 최근사용
 *                 iconKey: null
 *                 iconUrl: https://cdn.example.com/icons/my.png
 *                 displayOrder: 4
 *                 wordCount: 0
 *               message: 카테고리 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 카테고리를 찾을 수 없음
 *       409:
 *         description: 중복된 카테고리 이름
 */

/**
 * @swagger
 * /api/pm/categories/{id}:
 *   delete:
 *     tags: [Category]
 *     summary: PM02 낱말 카테고리 삭제
 *     description: |
 *       낱말 카테고리를 삭제합니다.
 *       해당 카테고리에 포함된 사용자 낱말은 모두 함께 삭제됩니다.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 삭제할 카테고리 ID
 *     responses:
 *       200:
 *         description: 카테고리 삭제 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 categoryId: uuid
 *                 deletedWordCount: 13
 *               message: 카테고리 삭제 성공
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */

router.delete("/:id", removeCategory);

export default router;
