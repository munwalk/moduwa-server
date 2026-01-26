import { AiPredictionTimeoutError } from '../../errors/app.error.js';

// FastAPI 서버 URL 설정
// Docker 환경에서는 서비스 이름(fastapi)으로 접근
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://fastapi:8000';

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
 * @returns {Promise<Array>} 추천 문장 3개
 */
const predictSentences = async (words = [], typedText = '', context = {}, refresh = false) => {
  const { currentTime, previousMessages = [] } = context;

  // FastAPI 요청 페이로드 생성
  const payload = {
    words,
    context: {
      current_time: currentTime,
      previous_messages: previousMessages.slice(-3) // 최근 3개만 전달
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

    // 응답 정규화 (confidence 값 범위 제한)
    return result.predictions.slice(0, 3).map(pred => ({
      sentence: pred.sentence || pred.text, // FastAPI가 text 또는 sentence 필드 사용 가능
      confidence: Math.min(Math.max(pred.confidence || pred.score || 0.5, 0), 1)
    }));
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

export { predictSentences };