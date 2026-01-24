import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

console.log(`🔌 Redis 접속 시도 주소: ${redisUrl}`);

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('error', (err) => {
    console.error(`❌ Redis 에러 (${redisUrl}):`, err.message);
});

redisClient.on('connect', () => {
    console.log(`✅ Redis 연결 성공: ${redisUrl}`);
});

try {
    await redisClient.connect();
} catch (err) {
    console.error('❌ Redis 초기 연결 실패. 캐싱이 작동하지 않습니다.');
}

export default redisClient;