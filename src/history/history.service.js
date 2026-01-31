import {
  findAllByUserId,
  findById,
  deleteById,
  deleteAllByUserId,
  findFrequentWords
} from './history.repository.js';
import { NotFoundError } from '../errors/app.error.js';
import { getFromCache, saveToCache } from '../utils/cache.util.js';

const getAllHistory = async (userId, year, month) => {
  return await findAllByUserId(userId, year, month);
};

const deleteHistory = async (historyId, userId) => {
  const history = await findById(historyId, userId); 
  if (!history) {
    throw new NotFoundError('해당 대화 이력을 찾을 수 없습니다');
  }

  await deleteById(historyId, userId);

  // 캐시 삭제 불필요:
  // - 캐시 키에 userId가 포함되지 않아 사용자별 삭제 불가능
  // - rankByLearningData()가 캐시 조회 후에도 재적용되어 학습 데이터가 반영됨
  // await deleteByPattern(`aac:predictions:*`); // 모든 사용자 캐시 삭제 (성능 문제)

  return { deletedId: historyId };
};

const deleteAllHistory = async (userId, year, month) => {
  const result = await deleteAllByUserId(userId, year, month);
  return { deletedCount: result.count };
};

// 오프라인 사용을 위한 자주 사용하는 낱말 조회 (캐싱 적용)
const getOfflineWords = async (userId, limit = 80) => { // 기본값 80
  const cacheKey = `offline:words:${userId}:${limit}`;

  // 1. 캐시 확인
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return {
      words: cached,
      fromCache: true
    };
  }

  // 2. DB에서 조회
  const words = await findFrequentWords(userId, limit);

  // 3. 캐시에 저장 (24시간 = 86400초)
  await saveToCache(cacheKey, words, 86400);

  return {
    words,
    fromCache: false
  };
};

export { getAllHistory, deleteHistory, deleteAllHistory, getOfflineWords };