import express from 'express';
import wordsController from './words.controller.js';
import { authenticate, optionalAuthenticate } from '../auth/middlewares/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/in/words - 낱말 카드 조회
 * Query: categoryId, onlyFavorite
 * 인증: 선택 (토큰 있으면 사용자별, 없으면 기본 낱말만)
 */
router.get('/', optionalAuthenticate, wordsController.getWords.bind(wordsController));

/**
 * POST /api/pm/words - 개인 낱말 카드 추가
 * Body: categoryId, word, imageUrl
 * 인증: 필수
 */
router.post('/', authenticate, wordsController.createWord.bind(wordsController));

/**
 * PATCH /api/pm/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
 * Body: isFavorite
 * 인증: 필수
 */
router.patch('/:cardId/favorite', authenticate, wordsController.updateFavorite.bind(wordsController));

/**
 * PATCH /api/pm/words/:cardId - 낱말 카드 수정
 * Body: word, imageUrl
 * 인증: 필수
 */
router.patch('/:cardId', authenticate, wordsController.updateWord.bind(wordsController));

/**
 * DELETE /api/pm/words/:cardId - 낱말 카드 삭제
 * 인증: 필수
 */
router.delete('/:cardId', authenticate, wordsController.deleteWord.bind(wordsController));

export default router;
