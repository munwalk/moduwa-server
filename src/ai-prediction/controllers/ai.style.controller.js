import { transformSentenceStyle } from '../services/ai.style.service.js';

/**
 * AI-05: 어미 선택 카드 적용 문장 추천
 *
 * POST /api/ai/transform-style
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
    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, endingCards, refresh = false } = req.body;

    // AI 문장 추천 호출 (refresh 파라미터 전달)
    const result = await transformSentenceStyle(words, endingCards, refresh);

    return res.status(200).success(result, '문장 추천 성공');
  } catch (error) {
    return next(error);
  }
};

export { transformStyleController };
