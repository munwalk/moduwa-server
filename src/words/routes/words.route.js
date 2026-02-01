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
router.get('/', optionalAuthenticate, wordsController.getWords.bind(wordsController));

/**
 * POST /api/words - 개인 낱말 카드 추가
 * Body: categoryId, word, imageUrl
 * 인증: 필수 (SOCIAL 계정만)
 */
router.post('/', authenticate, socialOnly, wordsController.createWord.bind(wordsController));

/**
 * PATCH /api/words/reorder - 낱말 카드 순서 변경
 * Body: categoryId, orderedCardIds
 * 인증: 필수 (SOCIAL 계정만)
 * Note: 이 라우트는 /:cardId/favorite, /:cardId 보다 위에 있어야 함
 */
router.patch('/reorder', authenticate, socialOnly, wordsValidator.validateReorderWordsBody, wordsController.reorderWords.bind(wordsController));

/**
 * PATCH /api/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
 * Body: isFavorite
 * 인증: 필수 (SOCIAL 계정만)
 */
router.patch('/:cardId/favorite', authenticate, socialOnly, wordsController.updateFavorite.bind(wordsController));

/**
 * PATCH /api/words/:cardId - 낱말 카드 수정
 * Body: word, imageUrl
 * 인증: 필수 (SOCIAL 계정만)
 */
router.patch('/:cardId', authenticate, socialOnly, wordsController.updateWord.bind(wordsController));

/**
 * DELETE /api/words/:cardId - 낱말 카드 삭제
 * 인증: 필수 (SOCIAL 계정만)
 */
router.delete('/:cardId', authenticate, socialOnly, wordsController.deleteWord.bind(wordsController));

export default router;
