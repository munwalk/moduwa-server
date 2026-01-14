import express from 'express';
import wordsController from './words.controller.js';

const router = express.Router();

/**
 * GET /api/in/words - 낱말 카드 조회
 * Query: categoryId, onlyFavorite
 */
router.get('/', wordsController.getWords.bind(wordsController));

/**
 * POST /api/pm/words - 개인 낱말 카드 추가
 * Body: categoryId, word, imageUrl
 */
router.post('/', wordsController.createWord.bind(wordsController));

/**
 * PATCH /api/pm/words/:cardId/favorite - 낱말 카드 즐겨찾기 변경
 * Body: isFavorite
 */
router.patch('/:cardId/favorite', wordsController.updateFavorite.bind(wordsController));

/**
 * PATCH /api/pm/words/:cardId - 낱말 카드 수정
 * Body: word, imageUrl
 */
router.patch('/:cardId', wordsController.updateWord.bind(wordsController));

/**
 * DELETE /api/pm/words/:cardId - 낱말 카드 삭제
 */
router.delete('/:cardId', wordsController.deleteWord.bind(wordsController));

export default router;
