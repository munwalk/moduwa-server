import { transformSentenceStyle } from './ai.style.service.js';

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
    const { words, endingCards, refresh = false } = req.body;

    // 낱말 카드 검증
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '낱말 카드를 최소 1개 이상 선택해주세요'
      });
    }

    // 낱말 카드 개수 검증 (최대 15개)
    if (words.length > 15) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '낱말 카드는 최대 15개까지 선택 가능합니다'
      });
    }

    // 어미 선택 카드 검증 (배열, 1~5개)
    if (!endingCards || !Array.isArray(endingCards)) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '어미 선택 카드를 최소 1개 이상 선택해주세요'
      });
    }

    if (endingCards.length === 0) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '어미 선택 카드를 최소 1개 이상 선택해주세요'
      });
    }

    if (endingCards.length > 5) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '어미 선택 카드는 최대 5개까지 선택 가능합니다'
      });
    }

    // LLM이 커스텀 어미 카드도 유연하게 해석
    // 기본 5개 스타일에 고정되지 않음 - 유효성 검증 제거
    // LLM이 "부드럽게", "강하게", "해주세용" 등 커스텀 카드도 해석 가능

    // AI 문장 추천 호출 (refresh 파라미터 전달)
    const result = await transformSentenceStyle(words, endingCards, refresh);

    return res.status(200).success(result, '문장 추천 성공');
  } catch (error) {
    return next(error);
  }
};

export { transformStyleController };
