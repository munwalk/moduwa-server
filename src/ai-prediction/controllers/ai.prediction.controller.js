import { predictSentences, rankByLearningData } from '../services/ai.prediction.service.js';
import {
  AiPredictionTimeoutError,
  AiModelError
} from '../../errors/app.error.js';
import { generateCacheKey, getFromCache, saveToCache } from '../../utils/cache.util.js';

/**
 * AI 문장 추천 컨트롤러
 */
const predictController = async (req, res, next) => {
  try {
    console.log('🔵 AI predictions 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, context, refresh = false, tone } = req.body;
    const userId = req.user?.userId; // 인증된 사용자 ID (학습 데이터 가중치 적용용)

    // 캐시 조회 (refresh가 false이면 맥락 유무와 상관없이 조회)
    if (!refresh && words.length > 0) {
      const cacheContext = { previousMessages: context?.previousMessages || [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'predictions', null, tone);
      const cachedData = await getFromCache(cacheKey);

      if (cachedData?.predictions) {
        console.log('💾 캐시에서 반환');

        // 캐시된 결과에도 사용자별 학습 데이터 가중치 적용
        const rankedCached = await rankByLearningData(cachedData.predictions, userId);
        const finalPredictions = rankedCached.map(pred => pred.sentence);

        return res.status(200).success(
          { predictions: finalPredictions, tone: tone || null, fromCache: true },
          '문장 추천 성공 (캐시)'
        );
      }
    }

    // GPT 호출 (userId, tone 전달)
    console.log('🤖 GPT API 호출:', { words, context, refresh, userId, tone });
    const result = await predictSentences(words, null, context, refresh, userId, tone);

    // 캐시 저장 (모든 상황에서 원본 predictions 저장, 24시간 유지)
    if (words.length > 0) {
      const cacheContext = { previousMessages: context?.previousMessages || [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'predictions', null, tone);
      await saveToCache(cacheKey, { predictions: result.rawPredictions }, 86400);
    }

    // 응답 반환 (가중치 적용된 predictions, 문자열 배열로 반환)
    const finalPredictions = result.predictions.map(pred => pred.sentence);
    console.log('✅ 응답 전송:', {
      predictionsCount: finalPredictions.length,
      size: JSON.stringify(finalPredictions).length
    });
    return res.status(200).success(
      { predictions: finalPredictions, tone: tone || null, fromCache: false },
      '문장 추천 성공'
    );

  } catch (error) {
    // 타임아웃 에러는 그대로 전달
    if (error instanceof AiPredictionTimeoutError) {
      return next(error);
    }

    // AI 모델 에러 - 상세 정보 로깅
    console.error('[AI Prediction Error]', {
      message: error.message,
      stack: error.stack,
      words: req.body.words,
      context: req.body.context
    });

    // 개발 환경에서는 상세 에러 메시지 전달
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `문장 생성 중 오류가 발생했습니다: ${error.message}`
      : '문장 생성 중 오류가 발생했습니다';

    return next(new AiModelError(errorMessage));
  }
};

export { predictController };