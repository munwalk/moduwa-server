import { AiPredictionTimeoutError } from '../../errors/app.error.js';
import { rankByLearningData } from './ai.prediction.service.js';

// FastAPI 서버 URL 설정
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://fastapi:8000';

/**
 * AI-05: 어미 선택 카드 적용 문장 추천
 *
 * 낱말 카드 + 어미 선택 카드(들)을 조합하여 자연스러운 문장 3개를 생성
 *
 * @param {Array<string>} words - 낱말 카드 배열 (예: ["밥", "먹다"])
 * @param {Array<string>} endingCards - 어미 선택 카드 배열 (1~5개, 예: ["질문", "부드럽게"])
 * @param {boolean} refresh - 캐시 무시하고 새로 생성할지 여부
 * @param {string} userId - 사용자 ID (학습 데이터 가중치 적용용)
 * @returns {Promise<Object>} 추천 문장 3개 (빈도수 가중치 적용 후 정렬) + rawSentences
 */
const transformSentenceStyle = async (words, endingCards, refresh = false, userId = null, tone = null, context = {}) => {
  // 타임아웃 처리 (10초)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AiPredictionTimeoutError('AI 응답 시간 초과'));
    }, 10000);
  });

  // FastAPI 서버 호출
  const fetchPromise = fetch(`${FASTAPI_URL}/api/ai/styles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      words,
      endingCards,
      context: {
        currentTime: context?.currentTime,
        previousMessages: (context?.previousMessages || []).slice(-3)
      },
      ...(tone && { tone }), // tone이 있을 때만 포함
      refresh
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

  // 1단계: 응답 정규화 (confidence 값 추가)
  // FastAPI 응답 순서를 순위로 활용 (AI-01과 동일 방식)
  const rankScores = [0.6, 0.5, 0.4];
  const normalizedSentences = result.sentences.slice(0, 3).map((sentence, index) => ({
    sentence,
    confidence: rankScores[index] ?? 0.4
  }));

  // 2단계: 학습 데이터 가중치 적용 및 재정렬
  const rankedSentences = await rankByLearningData(normalizedSentences, userId);

  // 최종 반환: { sentences, rawSentences }
  // rawSentences는 캐싱용 (사용자별 가중치 미적용)
  return {
    words,
    endingCards,
    sentences: rankedSentences.map(pred => pred.sentence), // 가중치 적용된 문장
    rawSentences: normalizedSentences, // 캐싱용 원본 (confidence 포함, AI-01과 동일)
    fromCache: result.fromCache || false
  };
};

export { transformSentenceStyle };
