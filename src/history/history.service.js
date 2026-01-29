import {
  findAllByUserId,
  findById,
  deleteById,
  deleteAllByUserId
} from './history.repository.js';
import { NotFoundError } from '../errors/app.error.js';
import { deleteByPattern } from '../utils/cache.util.js';

const getAllHistory = async (userId, year, month) => {
  return await findAllByUserId(userId, year, month);
};

const deleteHistory = async (historyId, userId, year, month) => {
  const history = await findById(historyId, userId, year, month);
  if (!history) {
    throw new NotFoundError('해당 대화 이력을 찾을 수 없습니다 (해당 월에 존재하지 않음)');
  }

  await deleteById(historyId, userId);

  // 해당 사용자의 낱말 추천 캐시를 삭제하여 학습 데이터가 즉시 반영됨
  await deleteByPattern(`aac:predict:*`); 
  return { deletedId: historyId };
};

const deleteAllHistory = async (userId, year, month) => {
  const result = await deleteAllByUserId(userId, year, month);
  return { deletedCount: result.count };
};

export { getAllHistory, deleteHistory, deleteAllHistory };