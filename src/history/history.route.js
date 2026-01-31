import express from 'express';
import {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController,
  getOfflineWordsController
} from './history.controller.js';
import { authenticate } from '../auth/middlewares/auth.middleware.js';

const router = express.Router();

// 모든 경로에 authenticate를 적용하여 req.user.userId를 보장
// 오프라인 사용 낱말 조회 (더 구체적인 경로를 먼저 정의)
router.get('/offline-words', authenticate, getOfflineWordsController);

router.get('/', authenticate, getHistoryController);
router.delete('/:id', authenticate, deleteHistoryController);
router.delete('/', authenticate, deleteAllHistoryController);

export default router;