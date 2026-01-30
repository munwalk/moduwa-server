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
    console.log('🔵 AI Predict 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, context, refresh = false } = req.body;
    const userId = req.user?.userId; // 인증된 사용자 ID (학습 데이터 가중치 적용용)

    // 캐시 조회 (refresh가 false이면 맥락 유무와 상관없이 조회)
    if (!refresh && words.length > 0) {
      const cacheContext = { previousMessages: context?.previousMessages || [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'predict');  
      const cachedData = await getFromCache(cacheKey);

      if (cachedData?.predictions) {
        console.log('💾 캐시에서 반환');

        // 캐시된 결과에도 사용자별 학습 데이터 가중치 적용
        const rankedCached = await rankByLearningData(cachedData.predictions, userId);
        const finalPredictions = rankedCached.map(pred => ({
          sentence: pred.sentence,
          confidence: pred.finalScore || pred.confidence
        }));

        return res.status(200).success(
          { predictions: finalPredictions, fromCache: true },
          '문장 추천 성공 (캐시)'
        );
      }
    }

    // GPT 호출 (userId 전달하여 학습 데이터 가중치 적용)
    console.log('🤖 GPT API 호출:', { words, context, refresh, userId });
    const result = await predictSentences(words, null, context, refresh, userId);

    // 캐시 저장 (모든 상황에서 원본 predictions 저장, 24시간 유지)
    if (words.length > 0) {
      const cacheContext = { previousMessages: context?.previousMessages || [] };
      const cacheKey = generateCacheKey(words, cacheContext, 'predict');
      await saveToCache(cacheKey, { predictions: result.rawPredictions }, 86400);
    }

    // 응답 반환 (가중치 적용된 predictions)
    console.log('✅ 응답 전송:', {
      predictionsCount: result.predictions.length,
      size: JSON.stringify(result.predictions).length
    });
    return res.status(200).success(
      { predictions: result.predictions, fromCache: false },
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