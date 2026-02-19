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
 *     description: |
 *       낱말 카드를 조합하여 자연스러운 문장 3개를 추천합니다. 캐시가 있으면 즉시 반환하고, 없으면 AI 호출 후 캐시에 저장합니다.
 *
 *       **`tone`** — 반말/존댓말 토글 (기기 내 설정값 반영)
 *
 *       > 토글 OFF → `HONORIFIC` (존댓말, 기본값) / 토글 ON → `INFORMAL` (반말)
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
 *               tone:
 *                 type: string
 *                 enum: [HONORIFIC, INFORMAL]
 *                 description: "tone — 반말/존댓말 토글 (기기 내 설정값 반영)\n\n토글 OFF → HONORIFIC (존댓말, 기본값) / 토글 ON → INFORMAL (반말)"
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
 *                     tone:
 *                       type: string
 *                       nullable: true
 *                       enum: [HONORIFIC, INFORMAL]
 *                       description: 요청한 tone 값 (미전달 시 null)
 *                       example: "HONORIFIC"
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
 *               invalidTone:
 *                 summary: tone 값 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "tone은 HONORIFIC 또는 INFORMAL만 가능합니다"
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
 *     description: |
 *       낱말 카드 + 어미 카드를 조합하여 특정 스타일의 문장을 생성합니다. AI-01(`predictions`)과 동일한 Cache-First 전략 및 순위 기반 가중치 적용.
 *
 *       **`endingCards`** — 어미 선택 카드 (문장 스타일 지정). **필수**
 *
 *       > `하고 싶어요` / `하기 싫어요` / `질문` / `해주세요` / `합시다` 및 사용자 커스텀 어미 가능.
 *       > LLM이 어미의 의미를 해석하여 자연스러운 문장으로 변환합니다.
 *
 *       **`tone`** — 반말/존댓말 토글 (기기 내 설정값 반영). 선택사항
 *
 *       > 토글 OFF → `HONORIFIC` (존댓말, 기본값) / 토글 ON → `INFORMAL` (반말)
 *
 *       두 파라미터는 **독립적이며 동시에 사용 가능**합니다. `tone`은 반말/존댓말만 제어하고, `endingCards`는 문장의 의도/어미를 제어합니다.
 *
 *       **`context`** — 대화 맥락 정보 (선택사항). AI-01과 동일하게 `previousMessages`가 캐시 키에 포함됩니다.
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
 *             description: "`tone`과 `endingCards`는 독립적인 파라미터입니다. `tone`은 반말/존댓말만 제어하고, `endingCards`는 문장의 의도와 어미 스타일을 제어합니다."
 *             example:
 *               words: ["밥", "먹다"]
 *               endingCards: ["질문"]
 *               tone: "INFORMAL"
 *               context:
 *                 currentTime: "2026년 1월 28일 (화) 14:30"
 *                 previousMessages: ["약 먹어야 해", "오늘 기분 좋아"]
 *               refresh: false
 *             properties:
 *               words:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 10
 *                 description: 선택한 낱말 카드 배열 (1~10개)
 *               endingCards:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 5
 *                 description: "선택한 어미 카드 배열 (필수, 최대 5개). 기본 카드: 하고 싶어요, 하기 싫어요, 질문, 해주세요, 합시다. tone과 독립적으로 동시 사용 가능."
 *               context:
 *                 type: object
 *                 description: 대화 맥락 정보 (선택사항). AI-01과 동일하게 캐시 키에 포함됩니다.
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
 *               tone:
 *                 type: string
 *                 enum: [HONORIFIC, INFORMAL]
 *                 description: "tone — 반말/존댓말 토글 (기기 내 설정값 반영)\n\n토글 OFF → HONORIFIC (존댓말, 기본값) / 토글 ON → INFORMAL (반말)"
 *               refresh:
 *                 type: boolean
 *                 default: false
 *                 description: 캐시 무시하고 새로 생성 여부 (기본값 false)
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
 *                       description: "입력한 어미 카드 배열 (tone 카드 미포함)"
 *                       example: ["질문"]
 *                     tone:
 *                       type: string
 *                       nullable: true
 *                       enum: [HONORIFIC, INFORMAL]
 *                       description: 요청한 tone 값 (미전달 시 null)
 *                       example: "INFORMAL"
 *                     sentences:
 *                       type: array
 *                       description: "스타일 변환된 문장 3개 (tone + endingCards 동시 적용, 사용자별 가중치 정렬)"
 *                       items:
 *                         type: string
 *                       example: ["밥 먹을래?", "밥 먹어?", "밥 먹을 거야?"]
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
 *               invalidTone:
 *                 summary: tone 값 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "tone은 HONORIFIC 또는 INFORMAL만 가능합니다"
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
 * @swagger
 * /api/ai/conversations/{conversationId}:
 *   patch:
 *     summary: 대화 문장 편집
 *     description: 저장된 대화 기록의 selectedSentence를 편집하고, AIFeedback 레코드를 생성합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 대화 기록 ID (중괄호 없이 UUID만 입력)
 *         example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - editedSentence
 *             properties:
 *               editedSentence:
 *                 type: string
 *                 description: 편집된 문장 (빈 문자열 불가)
 *                 example: "배고파서 밥 먹고 싶습니다"
 *               editDetails:
 *                 type: object
 *                 description: 편집 세부 정보 (선택사항)
 *                 properties:
 *                   editType:
 *                     type: string
 *                     description: 편집 유형
 *                     example: "STYLE_CHANGE"
 *                   changedWords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: 변경된 단어 목록
 *                     example: ["싶어요 → 싶습니다"]
 *     responses:
 *       200:
 *         description: 문장 편집 성공
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
 *                       example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *                     originalSentence:
 *                       type: string
 *                       example: "배고파서 밥 먹고 싶어요"
 *                     editedSentence:
 *                       type: string
 *                       example: "배고파서 밥 먹고 싶습니다"
 *                     feedbackId:
 *                       type: string
 *                       format: uuid
 *                       example: "fb-uuid-5678"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-07T12:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "문장이 성공적으로 편집되었습니다"
 *       400:
 *         description: 유효성 검사 실패 또는 변경 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 summary: editedSentence 누락
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "editedSentence이 필요합니다"
 *               noChange:
 *                 summary: 변경 사항 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "AI005"
 *                     message: "기존 문장과 동일합니다"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: 대화를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI003"
 *                 message: "대화를 찾을 수 없습니다"
 *       410:
 *         description: 삭제된 대화
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI004"
 *                 message: "삭제된 대화입니다"
 */
router.patch('/conversations/:conversationId', authenticate, validateEditRequest, editConversationController);

/**
 * @swagger
 * /api/ai/conversations/{conversationId}/history:
 *   get:
 *     summary: 대화 편집 이력 조회
 *     description: 특정 대화의 편집 이력을 조회합니다. AIFeedback 레코드를 반환합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 대화 기록 ID
 *         example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *     responses:
 *       200:
 *         description: 편집 이력 조회 성공
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
 *                       example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "fb-uuid-1"
 *                           originalSentence:
 *                             type: string
 *                             example: "배고파서 밥 먹고 싶어요"
 *                           editedSentence:
 *                             type: string
 *                             example: "배고파서 밥 먹고 싶습니다"
 *                           feedbackType:
 *                             type: string
 *                             enum: [EDITED, STYLE_CHANGED]
 *                             example: "EDITED"
 *                           editDetails:
 *                             type: object
 *                             nullable: true
 *                             example: { "editType": "STYLE_CHANGE", "changedWords": ["싶어요 → 싶습니다"] }
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-07T12:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "편집 이력 조회 성공"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: 대화를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI003"
 *                 message: "대화를 찾을 수 없습니다"
 */
router.get('/conversations/:conversationId/history', authenticate, getEditHistoryController);

// ==========================================
// AI-03: 즐겨찾기
// ==========================================

/**
 * @swagger
 * /api/ai/favorites:
 *   post:
 *     summary: 즐겨찾기 추가
 *     description: 문장을 즐겨찾기에 추가합니다. 중복된 문장은 추가할 수 없습니다.
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
 *               - sentence
 *               - sentenceSource
 *             properties:
 *               sentence:
 *                 type: string
 *                 description: 즐겨찾기할 문장 (빈 문자열 불가)
 *                 example: "배고파서 밥 먹고 싶습니다"
 *               sentenceSource:
 *                 type: string
 *                 enum: [AI_SUGGESTED, USER_TYPED, EDITED]
 *                 description: 문장 출처 (AI_SUGGESTED | USER_TYPED | EDITED)
 *                 example: "EDITED"
 *     responses:
 *       201:
 *         description: 즐겨찾기 추가 성공
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "fav-uuid-1234"
 *                     sentence:
 *                       type: string
 *                       example: "배고파서 밥 먹고 싶습니다"
 *                     sentenceSource:
 *                       type: string
 *                       enum: [AI_SUGGESTED, USER_TYPED, EDITED]
 *                       example: "EDITED"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-07T12:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "즐겨찾기에 추가되었습니다"
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noSentence:
 *                 summary: sentence 누락
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "sentence이 필요합니다"
 *               invalidSource:
 *                 summary: sentenceSource 유효하지 않음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "sentenceSource는 AI_SUGGESTED, USER_TYPED, EDITED 중 하나여야 합니다"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: 이미 즐겨찾기에 추가된 문장
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI006"
 *                 message: "이미 즐겨찾기에 추가된 문장입니다"
 */
router.post('/favorites', authenticate, validateAddFavoriteRequest, addFavoriteController);

/**
 * @swagger
 * /api/ai/favorites/{favoriteId}:
 *   delete:
 *     summary: 즐겨찾기 해제
 *     description: 즐겨찾기에서 문장을 삭제합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: favoriteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 즐겨찾기 ID
 *         example: "fav-uuid-1234"
 *     responses:
 *       200:
 *         description: 즐겨찾기 해제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: "null"
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "즐겨찾기에서 제거되었습니다"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: 즐겨찾기를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AI007"
 *                 message: "즐겨찾기를 찾을 수 없습니다"
 */
router.delete('/favorites/:favoriteId', authenticate, removeFavoriteController);

/**
 * @swagger
 * /api/ai/favorites:
 *   get:
 *     summary: 즐겨찾기 목록 조회
 *     description: 사용자의 즐겨찾기 목록을 조회합니다. limit과 offset으로 페이지네이션을 지원합니다.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 조회할 개수 (기본값 전체)
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: 건너뛸 개수 (기본값 0)
 *         example: 0
 *     responses:
 *       200:
 *         description: 즐겨찾기 목록 조회 성공
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
 *                     favorites:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "fav-uuid-1"
 *                           sentence:
 *                             type: string
 *                             example: "배고파서 밥 먹고 싶습니다"
 *                           sentenceSource:
 *                             type: string
 *                             enum: [AI_SUGGESTED, USER_TYPED, EDITED]
 *                             example: "EDITED"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-07T12:00:00.000Z"
 *                     total:
 *                       type: integer
 *                       description: 전체 즐겨찾기 개수
 *                       example: 15
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         offset:
 *                           type: integer
 *                           example: 0
 *                 message:
 *                   type: string
 *                   example: "즐겨찾기 목록 조회 성공"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/favorites', authenticate, getFavoritesController);

export default router;