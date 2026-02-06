import express from 'express';
import { predictController } from '../controllers/ai.prediction.controller.js';
import { contextController } from '../controllers/ai.context.controller.js';
import { saveConversationController } from '../controllers/ai.conversation.controller.js';
import { transformStyleController } from '../controllers/ai.style.controller.js';
import { editConversationController, getEditHistoryController } from '../controllers/ai.edit.controller.js';
import { addFavoriteController, removeFavoriteController, getFavoritesController } from '../controllers/ai.favorite.controller.js';
import {
  validatePredictRequest,
  validateStyleRequest,
  validateConversationRequest,
  validateEditRequest,
  validateAddFavoriteRequest
} from '../middlewares/ai.validator.js';
import { authenticate } from '../../auth/middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/ai/predictions:
 *   post:
 *     summary: 문장 추천 (기본 3가지)
 *     description: 낱말 카드를 조합하여 자연스러운 문장 3개를 추천합니다. 캐시가 있으면 즉시 반환하고, 없으면 AI 호출 후 캐시에 저장합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - words
 *             properties:
 *               words:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: 선택한 낱말 카드 배열 (1~10개)
 *                 example: ["물", "주다"]
 *               context:
 *                 type: object
 *                 description: 대화 맥락 정보 (선택사항)
 *                 properties:
 *                   currentTime:
 *                     type: string
 *                     description: 현재 시각 (한국 시각 형식)
 *                     example: "2026년 1월 28일 (화) 14:30"
 *                   previousMessages:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 최근 대화 기록 (최대 10분 이내)
 *                     example: ["약 먹어야 해", "오늘 기분 좋아"]
 *               refresh:
 *                 type: boolean
 *                 default: false
 *                 description: 캐시 무시하고 새로 생성 여부 (기본값 false)
 *                 example: false
 *     responses:
 *       200:
 *         description: 문장 추천 성공
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
 *                     predictions:
 *                       type: array
 *                       description: 추천 문장 3개 (사용자별 가중치 적용 후 정렬, 문자열 배열)
 *                       items:
 *                         type: string
 *                       example: ["물 좀 주세요", "물 주실래요?", "물 한 잔 주시겠어요?"]
 *                     fromCache:
 *                       type: boolean
 *                       description: 캐시에서 반환되었는지 여부
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "문장 추천 성공"
 *       400:
 *         description: 낱말 카드 없음 또는 개수 초과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noWords:
 *                 summary: 낱말 카드 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "낱말 카드를 최소 1개 이상 선택해주세요"
 *                     detail: null
 *               tooManyWords:
 *                 summary: 낱말 카드 개수 초과
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "낱말 카드는 최소 1개, 최대 10개까지 선택 가능합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: AI 모델 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI002"
 *                 message: "문장 생성 중 오류가 발생했습니다"
 *       408:
 *         description: AI 응답 시간 초과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI001"
 *                 message: "AI 응답이 10초를 초과했습니다"
 */
router.post('/predictions', authenticate, validatePredictRequest, predictController);

/**
 * @swagger
 * /api/ai/conversations:
 *   post:
 *     summary: 전체 대화 흐름 저장
 *     description: |
 *       AI가 추천한 문장 중 사용자가 선택한 문장을 저장합니다.
 *       이 API를 호출해야만:
 *       1. DB에 대화 이력 저장 (히스토리 기록)
 *       2. 학습 데이터 업데이트 (자주 선택한 문장이 다음번에 우선 추천됨)
 *       3. Redis 캐시 최신화
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - words
 *               - suggestedSentences
 *               - selectedSentence
 *               - selectionIndex
 *             properties:
 *               words:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 입력한 낱말 카드 배열
 *                 example: ["물", "주다"]
 *               suggestedSentences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: AI가 추천한 문장 3개
 *                 example: ["물 좀 주세요", "물 주실래요?", "물 한 잔 주시겠어요?"]
 *               selectedSentence:
 *                 type: string
 *                 description: 사용자가 선택한 문장
 *                 example: "물 좀 주세요"
 *               selectionIndex:
 *                 type: integer
 *                 description: 선택한 문장의 인덱스 (0~2)
 *                 minimum: 0
 *                 maximum: 2
 *                 example: 0
 *     responses:
 *       200:
 *         description: 대화 이력 저장 성공
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
 *                     conversationId:
 *                       type: string
 *                       format: uuid
 *                       description: 저장된 대화 기록 ID
 *                       example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *                     saved:
 *                       type: boolean
 *                       description: 저장 성공 여부
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "대화 이력 DB 저장 성공"
 *       400:
 *         description: 필수 필드 누락
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noWords:
 *                 summary: 낱말 배열 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "낱말 배열이 필요합니다"
 *                     detail: null
 *               noSuggested:
 *                 summary: 추천 문장 배열 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "추천 문장 배열이 필요합니다"
 *                     detail: null
 *               noSelected:
 *                 summary: 선택 문장 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "선택한 문장이 필요합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/conversations', authenticate, validateConversationRequest, saveConversationController);

/**
 * @swagger
 * /api/ai/contexts:
 *   get:
 *     summary: 10분 이내 대화 기록 조회
 *     description: 최근 10분 이내의 대화 기록을 조회하여 맥락 정보를 생성합니다. 이 정보는 문장 추천 시 context로 활용할 수 있습니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 맥락 조회 성공
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
 *                     context:
 *                       type: object
 *                       properties:
 *                         currentTime:
 *                           type: string
 *                           description: 현재 시각 (한국 시각 형식)
 *                           example: "2026년 1월 28일 (화) 14:30"
 *                         previousMessages:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: 최근 10분 이내 대화 기록 (selectedSentence만)
 *                           example: ["약 먹어야 해", "오늘 기분 좋아"]
 *                 message:
 *                   type: string
 *                   example: "맥락 조회 성공"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/contexts', authenticate, contextController);

/**
 * @swagger
 * /api/ai/styles:
 *   post:
 *     summary: 문장 스타일 변환
 *     description: 낱말 카드 + 어미 카드를 조합하여 특정 스타일의 문장을 생성합니다. predictions와 동일한 Cache-First 전략을 사용합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - words
 *               - endingCards
 *             properties:
 *               words:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: 선택한 낱말 카드 배열 (1~10개)
 *                 example: ["밥", "먹다"]
 *               endingCards:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 5
 *                 description: 선택한 어미 카드 배열 (1~5개)
 *                 example: ["질문", "부드럽게"]
 *               refresh:
 *                 type: boolean
 *                 default: false
 *                 description: 캐시 무시하고 새로 생성 여부 (기본값 false)
 *                 example: false
 *     responses:
 *       200:
 *         description: 문장 추천 성공
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
 *                         type: string
 *                       description: 입력한 낱말 카드 배열
 *                       example: ["밥", "먹다"]
 *                     endingCards:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 입력한 어미 카드 배열
 *                       example: ["질문", "부드럽게"]
 *                     sentences:
 *                       type: array
 *                       description: 스타일 변환된 문장 3개 (사용자별 가중치 적용 후 정렬, 문자열 배열)
 *                       items:
 *                         type: string
 *                       example: ["밥 드실래요?", "밥 좀 드시겠어요?", "밥 같이 드실까요?"]
 *                     fromCache:
 *                       type: boolean
 *                       description: 캐시에서 반환되었는지 여부
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "문장 추천 성공"
 *       400:
 *         description: 입력 값 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noWords:
 *                 summary: 낱말 카드 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "낱말 카드를 최소 1개 이상 선택해주세요"
 *                     detail: null
 *               tooManyWords:
 *                 summary: 낱말 카드 개수 초과
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "낱말 카드는 최대 10개까지 선택 가능합니다"
 *                     detail: null
 *               noEndings:
 *                 summary: 어미 카드 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "어미 선택 카드를 최소 1개 이상 선택해주세요"
 *                     detail: null
 *               tooManyEndings:
 *                 summary: 어미 카드 개수 초과
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "어미 선택 카드는 최대 5개까지 선택 가능합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: AI 모델 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI002"
 *                 message: "문장 생성 중 오류가 발생했습니다"
 *       408:
 *         description: AI 응답 시간 초과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI001"
 *                 message: "AI 응답이 10초를 초과했습니다"
 */
router.post('/styles', authenticate, validateStyleRequest, transformStyleController);

// ==========================================
// AI-02: 문장 편집
// ==========================================

/**
 * @route PATCH /api/ai/conversations/:conversationId
 * @desc AI-02: 대화 문장 편집
 * @access Private (인증 필요)
 */
router.patch('/conversations/:conversationId', authenticate, validateEditRequest, editConversationController);

/**
 * @route GET /api/ai/conversations/:conversationId/history
 * @desc AI-02: 대화 편집 이력 조회
 * @access Private (인증 필요)
 */
router.get('/conversations/:conversationId/history', authenticate, getEditHistoryController);

// ==========================================
// AI-03: 즐겨찾기
// ==========================================

/**
 * @route POST /api/ai/favorites
 * @desc AI-03: 즐겨찾기 추가
 * @access Private (인증 필요)
 */
router.post('/favorites', authenticate, validateAddFavoriteRequest, addFavoriteController);

/**
 * @route DELETE /api/ai/favorites/:favoriteId
 * @desc AI-03: 즐겨찾기 해제
 * @access Private (인증 필요)
 */
router.delete('/favorites/:favoriteId', authenticate, removeFavoriteController);

/**
 * @route GET /api/ai/favorites
 * @desc AI-03: 즐겨찾기 목록 조회
 * @access Private (인증 필요)
 */
router.get('/favorites', authenticate, getFavoritesController);

export default router;