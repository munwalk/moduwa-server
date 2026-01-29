import {
  getAllHistory,
  deleteHistory,
  deleteAllHistory
} from './history.service.js';
import { ValidationError } from '../errors/app.error.js';

const getHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 쿼리 파라미터에서 year, month 추출
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    // 유효성 검증
    if (!year || !month) {
      throw new ValidationError('year와 month 파라미터가 필요합니다');
    }

    if (year < 1900 || year > 2100) {
      throw new ValidationError('year는 1900~2100 사이여야 합니다');
    }

    if (month < 1 || month > 12) {
      throw new ValidationError('month는 1~12 사이여야 합니다');
    }

    const histories = await getAllHistory(userId, year, month);
    return res.status(200).success({ histories }, '대화 이력 조회 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteHistoryController = async (req, res, next) => {
  try {
    const { id: historyId } = req.params;
    const userId = req.user.userId;

    // 쿼리 파라미터에서 year, month 추출
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    // 유효성 검증
    if (!year || !month) {
      throw new ValidationError('year와 month 파라미터가 필요합니다');
    }

    if (year < 1900 || year > 2100) {
      throw new ValidationError('year는 1900~2100 사이여야 합니다');
    }

    if (month < 1 || month > 12) {
      throw new ValidationError('month는 1~12 사이여야 합니다');
    }

    const result = await deleteHistory(historyId, userId, year, month);
    return res.status(200).success(result, '대화 이력 삭제 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteAllHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 쿼리 파라미터에서 year, month 추출
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    // 유효성 검증
    if (!year || !month) {
      throw new ValidationError('year와 month 파라미터가 필요합니다');
    }

    if (year < 1900 || year > 2100) {
      throw new ValidationError('year는 1900~2100 사이여야 합니다');
    }

    if (month < 1 || month > 12) {
      throw new ValidationError('month는 1~12 사이여야 합니다');
    }

    const result = await deleteAllHistory(userId, year, month);
    return res.status(200).success(result, `${year}년 ${month}월 대화 이력 삭제 성공`);
  } catch (error) {
    return next(error);
  }
};

export {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController
};