import {
  getAllHistory,
  deleteHistory,
  deleteAllHistory
} from './history.service.js';

const getHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId; // 미들웨어에서 넘어온 값 사용 [cite: 10]
    const histories = await getAllHistory(userId);
    return res.status(200).success({ histories }, '대화 이력 조회 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteHistoryController = async (req, res, next) => {
  try {
    const { id: historyId } = req.params;
    const userId = req.user.userId;
    const result = await deleteHistory(historyId, userId);
    return res.status(200).success(result, '대화 이력 삭제 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteAllHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await deleteAllHistory(userId);
    return res.status(200).success(result, '모든 대화 이력 삭제 성공');
  } catch (error) {
    return next(error);
  }
};

export {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController
};