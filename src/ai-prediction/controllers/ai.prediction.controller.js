import { predictSentences } from '../services/ai.prediction.service.js';
import {
  AiPredictionTimeoutError,
  AiModelError
} from '../../errors/app.error.js';
import { getCache, setCache } from '../services/cache.service.js';

/**
 * AI 문장 추천 컨트롤러
 */
const predictController = async (req, res, next) => {
  try {
    console.log('🔵 AI Predict 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, context, refresh = false } = req.body;

    // 캐시 조회 (refresh가 false이고 맥락 없을 때만)
    if (!refresh && !context?.previousMessages?.length && words.length > 0) {
      const cached = await getCache(words);
      if (cached) {
        console.log('💾 캐시에서 반환');
        return res.status(200).success(
          { predictions: cached, fromCache: true },
          '문장 추천 성공 (캐시)'
        );
      }
    }

    // GPT 호출 (refresh 파라미터 전달)
    console.log('🤖 GPT API 호출:', { words, context, refresh });
    const predictions = await predictSentences(words, null, context, refresh);

    // 캐시 저장 (맥락 없을 때만)
    if (!context?.previousMessages?.length && words.length > 0) {
      await setCache(words, predictions);
    }

    // 응답 반환
    return res.status(200).success(
      { predictions, fromCache: false },
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