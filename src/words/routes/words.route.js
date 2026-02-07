import express from 'express';
import wordsController from '../controllers/words.controller.js';
import wordsValidator from '../middlewares/words.validator.js';
import { authenticate, optionalAuthenticate, socialOnly } from '../../auth/middlewares/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/words - 낱말 카드 조회
 * Query: categoryId, onlyFavorite
 * 인증: 선택 (토큰 있으면 사용자별, 없으면 기본 낱말만)
 */
/**
 * @swagger
 * /api/words:
 *   get:
 *     summary: 낱말 카드 조회
 *     description: |
 *       낱말 카드 목록을 조회합니다.
 *       토큰이 있으면 사용자별 낱말(즐겨찾기/개인화 포함), 없으면 기본 낱말만 반환합니다.
 *       categoryId가 있으면 data.category(카테고리 이름)도 함께 반환됩니다.
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 카테고리 ID (Category.id 또는 UserCategory.id)
 *         required: false
 *       - in: query
 *         name: onlyFavorite
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 즐겨찾기 낱말만 조회 여부
 *         required: false
 *     responses:
 *       200:
 *         description: 낱말 카드 조회 성공
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
 *                     category:
 *                       type: string
 *                       nullable: true
 *                       description: 카테고리 이름 (categoryId가 없으면 null)
 *                       example: "음식"
 *                     words:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/WordCard"
 *                 message:
 *                   type: string
 *                   example: "낱말 카드 목록 조회 성공"
 */
router.get('/', optionalAuthenticate, wordsController.getWords.bind(wordsController));

/**
 * POST /api/words - 개인 낱말 카드 추가
 * Body: categoryId, word, imageUrl
 * 인증: 필수 (SOCIAL 계정만)
 */
/**
 * @swagger
 * /api/words:
 *   post:
 *     summary: 개인 낱말 카드 추가
 *     description: 사용자가 직접 낱말 카드를 추가합니다. NLP로 품사를 자동 분석합니다.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, word]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: 카테고리 ID (Category.id 또는 UserCategory.id)
 *                 example: "4b74596e-5cad-4859-82a1-5cf43f6796fd"
 *               word:
 *                 type: string
 *                 description: 낱말 텍스트
 *                 example: "물"
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *                 description: 이미지 URL
 *                 example: "https://api.moduwa.com/images/물.png"
 *     responses:
 *       201:
 *         description: 개인 낱말 카드 추가 성공
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
 *                     word:
 *                       $ref: "#/components/schemas/WordCard"
 *                 message:
 *                   type: string
 *                   example: "개인 낱말 카드 추가 성공"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
 */
router.post('/', authenticate, socialOnly, wordsController.createWord.bind(wordsController));

/**
 * PATCH /api/words/reorder - 낱말 카드 순서 변경
 * Body: categoryId, orderedCardIds
 * 인증: 필수 (SOCIAL 계정만)
 * Note: 이 라우트는 /:cardId/favorite, /:cardId 보다 위에 있어야 함
 */
/**
 * @swagger
 * /api/words/reorder:
 *   patch:
 *     summary: 낱말 카드 순서 변경
 *     description: 낱말 카드의 표시 순서를 일괄 변경합니다.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, orderedCardIds]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: 카테고리 ID (Category.id 또는 UserCategory.id)
 *                 example: "4b74596e-5cad-4859-82a1-5cf43f6796fd"
 *               orderedCardIds:
 *                 type: array
 *                 description: 변경할 순서의 cardId 배열
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["6c10795b-1da1-498e-9bda-d7c23b982ae1", "1e22c59e-7c5b-4e88-98a7-1d7b1d8bd1d3"]
 *     responses:
 *       200:
 *         description: 낱말 카드 순서 변경 성공
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
 *                     words:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/WordCard"
 *                 message:
 *                   type: string
 *                   example: "낱말 카드 순서 변경 성공"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
 */
router.patch('/reorder', authenticate, socialOnly, wordsValidator.validateReorderWordsBody, wordsController.reorderWords.bind(wordsController));

/**
 * PATCH /api/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
 * Body: isFavorite
 * 인증: 필수 (SOCIAL 계정만)
 */
/**
 * @swagger
 * /api/words/{cardId}/favorite:
 *   patch:
 *     summary: 낱말 카드 즐겨찾기 변경
 *     description: |
 *       낱말 카드의 즐겨찾기 상태를 변경합니다.
 *       기본 낱말(Word)을 즐겨찾기 해제하는 경우 cardId가 변경될 수 있습니다.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 낱말 카드 ID (Word.id 또는 UserWord.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isFavorite]
 *             properties:
 *               isFavorite:
 *                 type: boolean
 *                 description: 즐겨찾기 여부
 *                 example: true
 *     responses:
 *       200:
 *         description: 낱말 카드 즐겨찾기 변경 성공
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
 *                     word:
 *                       type: object
 *                       properties:
 *                         cardId:
 *                           type: string
 *                           format: uuid
 *                           example: "6c10795b-1da1-498e-9bda-d7c23b982ae1"
 *                         isFavorite:
 *                           type: boolean
 *                           example: true
 *                 message:
 *                   type: string
 *                   example: "낱말 카드 즐겨찾기 변경 성공"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
 */
router.patch('/:cardId/favorite', authenticate, socialOnly, wordsController.updateFavorite.bind(wordsController));

/**
 * PATCH /api/words/:cardId - 낱말 카드 수정
 * Body: word, imageUrl
 * 인증: 필수 (SOCIAL 계정만)
 */
/**
 * @swagger
 * /api/words/{cardId}:
 *   patch:
 *     summary: 낱말 카드 수정
 *     description: 낱말 카드의 텍스트, 이미지, 카테고리를 수정합니다.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 낱말 카드 ID (Word.id 또는 UserWord.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word:
 *                 type: string
 *                 description: 수정할 낱말
 *                 example: "물"
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *                 description: 수정할 이미지 URL
 *                 example: "https://api.moduwa.com/images/물.png"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: 변경할 카테고리 ID
 *                 example: "4b74596e-5cad-4859-82a1-5cf43f6796fd"
 *     responses:
 *       200:
 *         description: 낱말 카드 수정 성공
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
 *                     word:
 *                       $ref: "#/components/schemas/WordCard"
 *                 message:
 *                   type: string
 *                   example: "낱말 카드 수정 성공"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
 */
router.patch('/:cardId', authenticate, socialOnly, wordsController.updateWord.bind(wordsController));

/**
 * DELETE /api/words/:cardId - 낱말 카드 삭제
 * 인증: 필수 (SOCIAL 계정만)
 */
/**
 * @swagger
 * /api/words/{cardId}:
 *   delete:
 *     summary: 낱말 카드 삭제
 *     description: 낱말 카드를 삭제(숨김) 처리합니다.
 *     tags: [Words]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 낱말 카드 ID (Word.id 또는 UserWord.id)
 *     responses:
 *       200:
 *         description: 낱말 카드 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   nullable: true
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "낱말 카드 삭제 성공"
 *       401:
 *         $ref: "#/components/responses/Unauthorized"
 *       403:
 *         $ref: "#/components/responses/Forbidden"
 */
router.delete('/:cardId', authenticate, socialOnly, wordsController.deleteWord.bind(wordsController));

export default router;
