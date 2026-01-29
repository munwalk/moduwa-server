import express from 'express';
import { predictController } from '../controllers/ai.prediction.controller.js';
import { selectionController } from '../controllers/ai.selection.controller.js';
import { contextController } from '../controllers/ai.context.controller.js';
import { saveConversationController } from '../controllers/ai.conversation.controller.js';
import { transformStyleController } from '../controllers/ai.style.controller.js';
import { editConversationController, getEditHistoryController } from '../controllers/ai.edit.controller.js';
import { addFavoriteController, removeFavoriteController, getFavoritesController } from '../controllers/ai.favorite.controller.js';
import {
  validatePredictRequest,
  validateStyleRequest,
  validateSelectionRequest,
  validateConversationRequest,
  validateEditRequest,
  validateAddFavoriteRequest
} from '../middlewares/ai.validator.js';
import { authenticate } from '../../auth/middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/ai/predict
 * @desc AI-01: 문장 추천 (기본 3가지)
 * @access Public
 */
router.post('/predict', validatePredictRequest, predictController);

/**
 * @route POST /api/ai/selection
 * @desc AI-01: 사용자 선택 문장 저장 (학습 데이터)
 * @access Public
 */
router.post('/selection', validateSelectionRequest, selectionController);

/**
 * @route POST /api/ai/conversation
 * @desc AI-01: 전체 대화 흐름 저장 (대화 기록)
 * @access Public
 */
router.post('/conversation', validateConversationRequest, saveConversationController);

/**
 * @route GET /api/ai/context
 * @desc AI-01: 10분 이내 대화 기록 조회 (맥락 생성)
 * @access Public
 */
router.get('/context', contextController);

/**
 * @route POST /api/ai/transform-style
 * @desc AI-05: 문장 스타일 변환 (어미 카드 적용)
 * @access Public
 */
router.post('/transform-style', validateStyleRequest, transformStyleController);

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