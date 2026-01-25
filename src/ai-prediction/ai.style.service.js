import { AiPredictionTimeoutError } from '../errors/app.error.js';

// FastAPI 서버 URL 설정
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * AI-05: 어미 선택 카드 적용 문장 추천
 *
 * 낱말 카드 + 어미 선택 카드(들)을 조합하여 자연스러운 문장 3개를 생성
 *
 * @param {Array<string>} words - 낱말 카드 배열 (예: ["밥", "먹다"])
 * @param {Array<string>} endingCards - 어미 선택 카드 배열 (1~5개, 예: ["질문", "부드럽게"])
 * @param {boolean} refresh - 캐시 무시하고 새로 생성할지 여부
 * @returns {Promise<Object>} 추천 문장 3개 + fromCache 여부
 */
const transformSentenceStyle = async (words, endingCards, refresh = false) => {
  // 타임아웃 처리 (10초)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AiPredictionTimeoutError('AI 응답 시간 초과'));
    }, 10000);
  });

  // FastAPI 서버 호출
  const fetchPromise = fetch(`${FASTAPI_URL}/api/ai/transform-style`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      words,
      endingCards, // 배열로 전달 (1~5개)
      refresh // 새로고침 파라미터
    })
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `FastAPI 서버 오류: ${response.status}`);
    }
    return response.json();
  });

  // 타임아웃과 API 호출 경쟁
  const result = await Promise.race([fetchPromise, timeoutPromise]);

  // FastAPI 응답 검증
  if (!result.sentences || !Array.isArray(result.sentences)) {
    throw new Error('AI 응답 형식 오류: sentences 배열이 없습니다');
  }

  return {
    words,
    endingCards,
    sentences: result.sentences,
    fromCache: result.fromCache || false // 캐시 여부 반환
  };
};

export { transformSentenceStyle };
