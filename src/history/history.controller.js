import {
  getAllHistory,
  deleteHistory,
  deleteAllHistory,
  getOfflineWords,
  getRecentWords
} from './history.service.js';
import { ValidationError } from '../errors/app.error.js';

/**
 * year, month 쿼리 파라미터 검증 헬퍼 함수
 * @param {number} year - 연도
 * @param {number} month - 월
 * @throws {ValidationError} 검증 실패 시
 */
const validateYearMonth = (year, month) => {
  if (!year || !month) {
    throw new ValidationError('year와 month 파라미터가 필요합니다');
  }

  if (year < 1900 || year > 2100) {
    throw new ValidationError('year는 1900~2100 사이여야 합니다');
  }

  if (month < 1 || month > 12) {
    throw new ValidationError('month는 1~12 사이여야 합니다');
  }
};

const getHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 쿼리 파라미터에서 year, month 추출 및 검증
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    validateYearMonth(year, month);

    console.log(`🔵 대화 이력 조회 요청: userId=${userId}, ${year}년 ${month}월`);

    const histories = await getAllHistory(userId, year, month);
    console.log(`✅ 대화 이력 조회 완료: ${histories.length}개`);

    return res.status(200).success({ histories }, '대화 이력 조회 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteHistoryController = async (req, res, next) => {
  try {
    const { id: historyId } = req.params;
    const userId = req.user.userId;

    console.log(`🗑️ 대화 이력 삭제 요청: userId=${userId}, historyId=${historyId}`);

    const result = await deleteHistory(historyId, userId);
    console.log(`✅ 대화 이력 삭제 완료: historyId=${historyId}`);

    return res.status(200).success(result, '대화 이력 삭제 성공');
  } catch (error) {
    return next(error);
  }
};

const deleteAllHistoryController = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // 쿼리 파라미터에서 year, month 추출 및 검증
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);
    validateYearMonth(year, month);

    console.log(`🗑️ 대화 이력 일괄 삭제 요청: userId=${userId}, ${year}년 ${month}월`);

    const result = await deleteAllHistory(userId, year, month);
    console.log(`✅ 대화 이력 일괄 삭제 완료: ${result.deletedCount}개 삭제`);

    return res.status(200).success(result, `${year}년 ${month}월 대화 이력 삭제 성공`);
  } catch (error) {
    return next(error);
  }
};

const getOfflineWordsController = async (req, res, next) => {
  try {
    // id와 userId 중 존재하는 값을 사용하도록 유연하게 수정
    const userId = req.user.id || req.user.userId; 

    if (!userId) {
      console.error('❌ [HIS-05] 유저 ID를 찾을 수 없습니다. req.user:', req.user);
      throw new ValidationError('인증 정보가 올바르지 않습니다');
    }

    // 쿼리 파라미터에서 limit 추출 (기본값: 80)
    let limit = parseInt(req.query.limit) || 80;

    // limit 유효성 검증
    if (limit < 1) {
      throw new ValidationError('limit은 1 이상이어야 합니다');
    }

    if (limit > 80) {
      throw new ValidationError('limit은 80 이하여야 합니다');
    }

    console.log(`🔵 오프라인 낱말 조회 요청: userId=${userId}, limit=${limit}`);

    const result = await getOfflineWords(userId, limit);
    console.log(`✅ 오프라인 낱말 조회 완료: ${result.words.length}개 (캐시: ${result.fromCache})`);

    return res.status(200).success(
      {
        words: result.words,
        totalCount: result.words.length,
        fromCache: result.fromCache
      },
      '오프라인 사용 낱말 조회 성공'
    );
  } catch (error) {
    return next(error);
  }
};

const getRecentWordsController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      console.error('❌ [HIS-06] 유저 ID를 찾을 수 없습니다. req.user:', req.user);
      throw new ValidationError('인증 정보가 올바르지 않습니다');
    }

    console.log(`🔵 최근 사용 낱말 조회 요청: userId=${userId}`);

    const words = await getRecentWords(userId);
    console.log(`✅ 최근 사용 낱말 조회 완료: ${words.length}개`);

    return res.status(200).success(
      {
        words,
        totalCount: words.length
      },
      '최근 사용 낱말 조회 성공'
    );
  } catch (error) {
    return next(error);
  }
};

export {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController,
  getOfflineWordsController,
  getRecentWordsController
};