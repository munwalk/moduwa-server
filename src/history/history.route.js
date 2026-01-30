import express from 'express';
import {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController
} from './history.controller.js';
import { authenticate } from '../auth/middlewares/auth.middleware.js';

const router = express.Router();

// 모든 경로에 authenticate를 적용하여 req.user.userId를 보장
router.get('/', authenticate, getHistoryController);
router.delete('/:id', authenticate, deleteHistoryController);
router.delete('/', authenticate, deleteAllHistoryController);

export default router;