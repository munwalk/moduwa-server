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

export default router;
