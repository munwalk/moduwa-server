import express from 'express';
import { predictController } from '../controllers/ai.prediction.controller.js';
import { selectionController } from '../controllers/ai.selection.controller.js';
import { contextController } from '../controllers/ai.context.controller.js';
import { saveConversationController } from '../controllers/ai.conversation.controller.js';
import { transformStyleController } from '../controllers/ai.style.controller.js';
import {
  validatePredictRequest,
  validateStyleRequest,
  validateSelectionRequest,
  validateConversationRequest
} from '../middlewares/ai.validator.js';
import { authenticate } from '../../auth/middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/ai/predictions
 * @desc AI-01: 문장 추천 (기본 3가지)
 * @access Private (인증 필요)
 */
router.post('/predictions', authenticate, validatePredictRequest, predictController);

/**
 * @route POST /api/ai/selections
 * @desc AI-01: 사용자 선택 문장 저장 (학습 데이터)
 * @access Private (인증 필요)
 */
router.post('/selections', authenticate, validateSelectionRequest, selectionController);

/**
 * @route POST /api/ai/conversations
 * @desc AI-01: 전체 대화 흐름 저장 (대화 기록)
 * @access Private (인증 필요)
 */
router.post('/conversations', authenticate, validateConversationRequest, saveConversationController);

/**
 * @route GET /api/ai/contexts
 * @desc AI-01: 10분 이내 대화 기록 조회 (맥락 생성)
 * @access Private (인증 필요)
 */
router.get('/contexts', authenticate, contextController);

/**
 * @route POST /api/ai/styles
 * @desc AI-05: 문장 스타일 변환 (어미 카드 적용)
 * @access Private (인증 필요)
 */
router.post('/styles', authenticate, validateStyleRequest, transformStyleController);

export default router;