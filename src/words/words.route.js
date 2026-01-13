import express from 'express';
import wordsController from './words.controller.js';

const router = express.Router();

/**
 * GET /api/in/words - 낱말 카드 조회
 * Query: categoryId, onlyFavorite
 */
router.get('/', wordsController.getWords.bind(wordsController));

export default router;
