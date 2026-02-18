import { transformSentenceStyle } from '../services/ai.style.service.js';
import { rankByLearningData } from '../services/ai.prediction.service.js';
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
    const { words, endingCards, tone, refresh = false } = req.body;
    const userId = req.user?.userId; // 인증된 사용자 ID (학습 데이터 가중치 적용용)

    // tone 우선 + endingCards 합성 정규화
    let normalizedEndingCards = Array.isArray(endingCards) ? [...endingCards] : [];

    if (tone) {
      // endingCards 안에 존댓말/반말이 들어와도 tone이 우선이므로 제거
      normalizedEndingCards = normalizedEndingCards.filter(
        (card) => card !== '존댓말' && card !== '반말'
      );

      const toneCard = tone === 'HONORIFIC' ? '존댓말' : '반말';
      normalizedEndingCards.unshift(toneCard);
    }

    // 캐시 조회 (refresh가 false일 때만)
    if (!refresh && words.length > 0 && normalizedEndingCards.length > 0) {
      const cacheContext = { previousMessages: [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'styles', normalizedEndingCards);
      const cached = await getFromCache(cacheKey);

      if (cached?.sentences) {
        console.log('💾 캐시에서 반환');

        // 캐시된 결과에도 사용자별 학습 데이터 가중치 적용
        const cachedWithConfidence = cached.sentences.map(sentence => ({
          sentence,
          confidence: 0.5 // 캐시된 데이터는 기본 confidence 값 사용
        }));
        const rankedCached = await rankByLearningData(cachedWithConfidence, userId);
        const finalSentences = rankedCached.map(pred => pred.sentence);

        return res.status(200).success(
          {
            words: cached.words,
            endingCards: cached.endingCards,
            sentences: finalSentences,
            fromCache: true
          },
          '문장 추천 성공 (캐시)'
        );
      }
    }

    // AI 문장 추천 호출 (userId 전달하여 학습 데이터 가중치 적용)
    console.log('🤖 FastAPI 호출:', { words, endingCards, refresh, userId });
    const result = await transformSentenceStyle(words, normalizedEndingCards, refresh, userId);

    // 캐시 저장 (원본 sentences만 저장, 사용자별 가중치 미적용)
    if (words.length > 0 && normalizedEndingCards.length > 0) {
      const cacheContext = { previousMessages: [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'styles', normalizedEndingCards);
      await saveToCache(cacheKey, {
        words: result.words,
        endingCards: result.endingCards,
        sentences: result.rawSentences // 가중치 미적용 원본
      }, 86400); // 24시간 TTL
    }

    return res.status(200).success(
      {
        words: result.words,
        endingCards: result.endingCards,
        sentences: result.sentences, // 가중치 적용된 sentences (문자열 배열)
        fromCache: false
      },
      '문장 추천 성공'
    );
  } catch (error) {
    return next(error);
  }
};

export { transformStyleController };
