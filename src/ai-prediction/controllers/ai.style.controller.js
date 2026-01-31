import { transformSentenceStyle } from '../services/ai.style.service.js';
import { generateCacheKey, getFromCache, saveToCache } from '../../utils/cache.util.js';

/**
 * AI-05: 어미 선택 카드 적용 문장 추천
 *
 * POST /api/ai/styles
 *
 * 중요: 어미 카드 사용 시 3개 문장 모두 해당 스타일로 통일
 * 예: ["질문"] 카드 → 3개 문장 모두 의문문
 * 예: ["질문", "부드럽게"] 카드 → 3개 문장 모두 부드러운 의문문 (다중 합성)
 *
 * - 어미 카드는 15개 제한에 포함되지 않음 (별도로 1~5개 제한)
 * - LLM이 커스텀 어미 카드도 유연하게 해석 (기본 5개에 고정 X)
 * - 다중 어미 카드 합성: 1~5개 카드를 동시에 선택 가능
 */
const transformStyleController = async (req, res, next) => {
  try {
    console.log('🟣 AI Style 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, endingCards, refresh = false } = req.body;

    // 캐시 조회 (refresh가 false일 때만)
    if (!refresh && words.length > 0 && endingCards.length > 0) {
      const cacheContext = { previousMessages: [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'styles', endingCards);
      const cached = await getFromCache(cacheKey);

      if (cached) {
        console.log('💾 캐시에서 반환');
        return res.status(200).success(
          { ...cached, fromCache: true },
          '문장 추천 성공 (캐시)'
        );
      }
    }

    // AI 문장 추천 호출 (refresh 파라미터 전달)
    console.log('🤖 FastAPI 호출:', { words, endingCards, refresh });
    const result = await transformSentenceStyle(words, endingCards, refresh);

    // 캐시 저장
    if (words.length > 0 && endingCards.length > 0) {
      const cacheContext = { previousMessages: [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'styles', endingCards);
      await saveToCache(cacheKey, result, 86400); // 24시간 TTL
    }

    return res.status(200).success(
      { ...result, fromCache: false },
      '문장 추천 성공'
    );
  } catch (error) {
    return next(error);
  }
};

export { transformStyleController };
