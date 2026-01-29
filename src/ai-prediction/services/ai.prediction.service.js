import { AiPredictionTimeoutError } from '../../errors/app.error.js';
import { countBySelectedSentence } from '../repositories/conversation.repository.js';

// FastAPI 서버 URL 설정
// Docker 환경에서는 서비스 이름(fastapi)으로 접근
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://fastapi:8000';

/**
 * 학습 데이터를 활용한 추천 순위 재정렬
 * GPT confidence + 사용자별 빈도수 가중치 합산
 *
 * @param {Array} predictions - FastAPI에서 받은 추천 문장 배열
 * @param {string} userId - 사용자 ID (빈도수 조회용)
 * @returns {Promise<Array>} 가중치가 적용되어 재정렬된 추천 문장 배열
 */
const rankByLearningData = async (predictions, userId) => {
  // userId가 없으면 빈도수 적용 불가 - 원본 순서 유지
  if (!userId || predictions.length === 0) {
    return predictions;
  }

  try {
    // 1. 각 문장의 사용 빈도 조회 (병렬 처리)
    const frequencies = await Promise.all(
      predictions.map(pred =>
        countBySelectedSentence(userId, pred.sentence)
      )
    );

    // 2. 최대 빈도수 계산 (정규화용)
    const maxFrequency = Math.max(...frequencies, 1); // 0으로 나누기 방지

    // 3. 가중치 계산
    const scoredPredictions = predictions.map((pred, index) => {
      const frequency = frequencies[index];
      const normalizedFreq = frequency / maxFrequency; // 0~1 범위

      // 가중치 공식: confidence 40% + frequency 60%
      const finalScore = (pred.confidence * 0.4) + (normalizedFreq * 0.6);

      return {
        ...pred,
        usageFrequency: frequency,
        normalizedFrequency: normalizedFreq,
        finalScore
      };
    });

    // 4. finalScore 기준 내림차순 정렬
    scoredPredictions.sort((a, b) => b.finalScore - a.finalScore);

    console.log('📊 가중치 재정렬 완료:', scoredPredictions.map(p => ({
      sentence: p.sentence.substring(0, 20) + '...',
      confidence: p.confidence.toFixed(2),
      frequency: p.usageFrequency,
      finalScore: p.finalScore.toFixed(2)
    })));

    return scoredPredictions;

  } catch (error) {
    console.error('⚠️ 빈도수 조회 실패, 원본 순서 유지:', error.message);
    // 에러 발생 시 원본 predictions 그대로 반환 (서비스 중단 방지)
    return predictions;
  }
};

/**
 * AI-01: FastAPI 서버를 통해 낱말 조합으로부터 문장 3개를 생성
 *
 * FastAPI 서버:
 * - Endpoint: POST /api/ai/predict
 * - OpenAI GPT-4o-mini 호출
 * - Redis 캐싱 (1시간 TTL)
 * - Temperature 0.3 (문법적 정확성 우선)
 *
 * @param {Array<string>} words - 선택된 낱말 카드 배열 (1~15개)
 * @param {string} typedText - 사용자가 직접 입력한 텍스트 (현재 미사용)
 * @param {Object} context - 문맥 정보
 * @param {boolean} refresh - 캐시 무시하고 새로 생성할지 여부
 * @param {string} userId - 사용자 ID (학습 데이터 가중치 적용용)
 * @returns {Promise<Array>} 추천 문장 3개 (빈도수 가중치 적용 후 정렬)
 */
const predictSentences = async (words = [], typedText = '', context = {}, refresh = false, userId = null) => {
  const { currentTime, previousMessages = [] } = context;

  // FastAPI 요청 페이로드 생성
  const payload = {
    words,
    context: {
      currentTime: currentTime,
      previousMessages: previousMessages.slice(-3) // 최근 3개만 전달
    },
    refresh // 새로고침 파라미터 추가
  };

  // AbortController로 타임아웃 처리 (10초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // FastAPI 서버 호출
    const response = await fetch(`${FASTAPI_URL}/api/ai/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `FastAPI 서버 오류: ${response.status}`);
    }

    const result = await response.json();

    // FastAPI 응답 검증
    if (!result.predictions || !Array.isArray(result.predictions)) {
      throw new Error('AI 응답 형식 오류: predictions 배열이 없습니다');
    }

    // 1단계: 응답 정규화 (confidence 값 범위 제한)
    const normalizedPredictions = result.predictions.slice(0, 3).map(pred => ({
      sentence: pred.sentence,
      confidence: Math.min(Math.max(pred.confidence || 0.5, 0), 1)
    }));

    // 2단계: 학습 데이터 가중치 적용 및 재정렬
    const rankedPredictions = await rankByLearningData(normalizedPredictions, userId);

    // 최종 반환: { predictions, rawPredictions }
    // rawPredictions는 캐싱용 (사용자별 가중치 미적용)
    return {
      predictions: rankedPredictions.map(pred => ({
        sentence: pred.sentence,
        confidence: pred.finalScore || pred.confidence
      })),
      rawPredictions: normalizedPredictions // 캐싱용 원본
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // AbortError는 타임아웃
    if (error.name === 'AbortError') {
      throw new AiPredictionTimeoutError('AI 응답이 10초를 초과했습니다');
    }

    // 그 외 에러는 그대로 전달
    throw error;
  }
};

export { predictSentences, rankByLearningData };