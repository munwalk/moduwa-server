import redis from 'redis';
import jwt from 'jsonwebtoken';

let redisClient;

/**
 * Redis 클라이언트 초기화
 */
export const initRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => console.error('[Redis] Client error:', err));

    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    redisClient = null;
  }
};

/**
 * Refresh Token 저장
 */
export const saveRefreshToken = async (userId, token) => {
  if (!redisClient) return;
  
  try {
    const key = `refresh_token:${userId}`;
    const ttl = 14 * 24 * 60 * 60;
    await redisClient.setEx(key, ttl, token);
  } catch (error) {
    console.error('Redis save error:', error);
  }
};

/**
 * Refresh Token 확인
 */
export const getRefreshToken = async (userId) => {
  if (!redisClient) return null;
  
  try {
    const key = `refresh_token:${userId}`;
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

/**
 * Refresh Token 삭제 (로그아웃)
 */
export const deleteRefreshToken = async (userId) => {
  if (!redisClient) return;
  
  try {
    const key = `refresh_token:${userId}`;
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

/**
 * Token 블랙리스트 추가
 */
export const addToBlacklist = async (token, expiresIn) => {
  if (!redisClient) return;
  
  try {
    const key = `blacklist:${token}`;
    await redisClient.setEx(key, expiresIn, 'true');
  } catch (error) {
    console.error('Redis blacklist error:', error);
  }
};

/**
 * Token 블랙리스트 확인
 */
export const isBlacklisted = async (token) => {
  if (!redisClient) return false;
  
  try {
    const key = `blacklist:${token}`;
    const result = await redisClient.get(key);
    return result === 'true';
  } catch (error) {
    console.error('Redis blacklist check error:', error);
    return false;
  }
};

/**
 * 임시 가입 정보 저장
 * 약관 동의 전에 소셜 로그인 정보를 임시로 저장
 */
export const savePendingSignup = async (provider, profile) => {
  if (!redisClient) return null; // Redis 연결 확인 추가
  
  const pendingToken = jwt.sign(
    { provider, profile },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );

  const TTL = 5 * 60;
  await redisClient.setEx(  // redis → redisClient
    `pending_signup:${pendingToken}`,
    TTL,
    JSON.stringify({ provider, profile })
  );

  return pendingToken;
};
/**
 * 임시 가입 정보 조회
 */
export const getPendingSignup = async (pendingToken) => {
  if (!redisClient) return null; // Redis 연결 확인 추가
  
  const data = await redisClient.get(`pending_signup:${pendingToken}`); //  redis → redisClient
  
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

/**
 * 임시 가입 정보 삭제
 */
export const deletePendingSignup = async (pendingToken) => {
  if (!redisClient) return; // Redis 연결 확인 추가
  
  await redisClient.del(`pending_signup:${pendingToken}`); // redis → redisClient
  return true;
};