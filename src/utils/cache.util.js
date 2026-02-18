import crypto from 'crypto';
import redisClient from '../config/redis.config.js';

/**
 * FastAPI와 동일한 캐시 키 생성 로직
 *
 * @param {string[]} words - 선택된 낱말 배열
 * @param {object} context - 대화 맥락
 * @param {string[]} context.previousMessages - 이전 대화 메시지 배열
 * @param {string} endpoint - 엔드포인트 타입 ('predictions' 또는 'styles')
 * @param {string[]} endingCards - 어미 선택 카드 배열 (styles 전용, optional)
 * @returns {string} 캐시 키
 *
 * @example
 * generateCacheKey(['물', '주세요'], { previousMessages: [] }, 'predictions')
 * // Returns: 'aac:predictions:a1b2c3d4...'
 *
 * @example
 * generateCacheKey(['밥', '먹다'], { previousMessages: [] }, 'styles', ['질문', '부드럽게'])
 * // Returns: 'aac:styles:e5f6g7h8...'
 */
export function generateCacheKey(words, context, endpoint = 'predictions', endingCards = null) {
  const cacheData = {
    words: [...words].sort(), // 순서 무관하게 정렬 (FastAPI와 동일)
    context: {
      previousMessages: context?.previousMessages || []
    },
    endpoint: endpoint
  };

  // styles 엔드포인트인 경우 endingCards 추가
  if (endpoint === 'styles' && endingCards && endingCards.length > 0) {
    cacheData.endingCards = [...endingCards].sort(); // 순서 무관하게 정렬
  }

  // 키를 정렬하여 JSON 문자열로 변환 (Python의 sort_keys=True 효과)
  const sortedData = Object.keys(cacheData).sort().reduce((obj, key) => {
    obj[key] = cacheData[key];
    return obj;
  }, {});
  const cacheStr = JSON.stringify(sortedData);
  const hash = crypto.createHash('md5').update(cacheStr, 'utf8').digest('hex');

  return `aac:${endpoint}:${hash}`;
}

/**
 * Redis에 캐시 저장
 *
 * @param {string} cacheKey - 캐시 키
 * @param {object} data - 저장할 데이터
 * @param {number} ttl - TTL (초 단위, 기본 24시간 = 86400초)
 * @returns {Promise<boolean>} 저장 성공 여부
 *
 * @example
 * await saveToCache('aac:predictions:abc123', { predictions: [...] }, 86400)
 */
export async function saveToCache(cacheKey, data, ttl = 86400) {
  try {
    // Redis 연결 확인
    if (!redisClient.isReady) {
      console.warn('⚠️ Redis 미연결: 캐시 저장 건너뜀');
      return false;
    }

    // JSON 직렬화 후 저장
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
    console.log(`✅ 캐시 저장 성공: ${cacheKey} (TTL: ${ttl}초)`);
    return true;
  } catch (error) {
    console.error(`⚠️ 캐시 저장 실패 (${cacheKey}):`, error.message);
    return false;
  }
}

/**
 * Redis에서 캐시 조회
 *
 * @param {string} cacheKey - 캐시 키
 * @returns {Promise<object|null>} 캐시된 데이터 또는 null
 *
 * @example
 * const cachedData = await getFromCache('aac:predictions:abc123')
 */
export async function getFromCache(cacheKey) {
  try {
    // Redis 연결 확인
    if (!redisClient.isReady) {
      return null;
    }

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`✅ 캐시 HIT: ${cacheKey}`);
      return JSON.parse(cached);
    }

    console.log(`ℹ️ 캐시 MISS: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(`⚠️ 캐시 조회 실패 (${cacheKey}):`, error.message);
    return null;
  }
}

/**
 * Redis에서 캐시 삭제
 *
 * @param {string} cacheKey - 캐시 키
 * @returns {Promise<boolean>} 삭제 성공 여부
 *
 * @example
 * await deleteFromCache('aac:predictions:abc123')
 */
export async function deleteFromCache(cacheKey) {
  try {
    // Redis 연결 확인
    if (!redisClient.isReady) {
      return false;
    }

    await redisClient.del(cacheKey);
    console.log(`✅ 캐시 삭제: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`⚠️ 캐시 삭제 실패 (${cacheKey}):`, error.message);
    return false;
  }
}

/**
 * 패턴에 맞는 모든 캐시 키 삭제
 *
 * @param {string} pattern - 삭제할 키 패턴 (예: 'aac:predictions:*')
 * @returns {Promise<number>} 삭제된 키 개수
 *
 * @example
 * const deletedCount = await deleteByPattern('aac:predictions:*')
 */
export async function deleteByPattern(pattern) {
  try {
    // Redis 연결 확인
    if (!redisClient.isReady) {
      return 0;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redisClient.del(keys);
    console.log(`✅ 캐시 일괄 삭제: ${keys.length}개 (패턴: ${pattern})`);
    return keys.length;
  } catch (error) {
    console.error(`⚠️ 캐시 일괄 삭제 실패 (${pattern}):`, error.message);
    return 0;
  }
}
