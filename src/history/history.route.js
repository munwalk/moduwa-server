import express from 'express';
import {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController
} from './history.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 모든 경로에 authMiddleware를 적용하여 req.user.userId를 보장
router.get('/', authMiddleware, getHistoryController);
router.delete('/:id', authMiddleware, deleteHistoryController);
router.delete('/', authMiddleware, deleteAllHistoryController);

export default router;