import crypto from 'crypto';
import redisClient from '../../config/redis.config.js';

/**
 * 낱말 조합으로 캐시 키 생성
 */
const generateCacheKey = (words) => {
  const normalized = words.join('|').toLowerCase();
  return `prediction:${crypto.createHash('md5').update(normalized).digest('hex')}`;
};

/**
 * 캐시 조회
 * Redis 캐시만 확인 (AI-01 담당 범위)
 * DB 학습 데이터는 AI-02가 관리
 */
const getCache = async (words) => {
  try {
    const key = generateCacheKey(words);
    const cached = await redisClient.get(key);
    if (cached) {
      console.log('✅ Redis 캐시 히트');
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('❌ Cache get error:', error);
    return null;
  }
};

/**
 * 캐시 저장 (24시간)
 */
const setCache = async (words, predictions) => {
  try {
    const key = generateCacheKey(words);
    await redisClient.setEx(key, 86400, JSON.stringify(predictions));
    console.log('✅ Redis 캐시 저장 완료');
  } catch (error) {
    console.error('❌ Cache set error:', error);
  }
};

export { getCache, setCache };