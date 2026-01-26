import { predictRequestSchema } from '../dto/ai.prediction.dto.js';

/**
 * AI 예측 요청 데이터 유효성 검사 미들웨어
 * POST /api/ai/predict
 */
export const validatePredictRequest = (req, res, next) => {
  const { error, value } = predictRequestSchema.validate(req.body);

  const { words = [] } = error ? req.body : value;

  // 1. 낱말 카드 없으면 에러
  if (!words || words.length === 0) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '낱말 카드를 최소 1개 이상 선택해주세요'
    });
  }

  // 2. 낱말 카드 범위 검증 (1~15개)
  if (words.length < 1 || words.length > 15) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '낱말 카드는 최소 1개, 최대 15개까지 선택 가능합니다'
    });
  }

  // 3. Joi 검증 에러 처리
  if (error) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: error.details[0].message
    });
  }

  // 검증된 데이터를 req.body에 갱신
  req.body = value;
  next();
};

/**
 * AI 스타일 변환 요청 데이터 유효성 검사 미들웨어
 * POST /api/ai/transform-style
 */
export const validateStyleRequest = (req, res, next) => {
  const { words, endingCards } = req.body;

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

  next();
};

/**
 * 사용자 선택 문장 저장 요청 검증 미들웨어
 * POST /api/ai/selection
 */
export const validateSelectionRequest = (req, res, next) => {
  const { words, recommendedSentences, selectedSentence } = req.body;

  // 필수 값 검증 - 개별적으로 검사
  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '낱말 배열이 필요합니다'
    });
  }

  if (!recommendedSentences || !Array.isArray(recommendedSentences)) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '추천 문장 배열이 필요합니다'
    });
  }

  if (!selectedSentence || typeof selectedSentence !== 'string') {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '선택한 문장이 필요합니다'
    });
  }

  next();
};

/**
 * 대화 저장 요청 검증 미들웨어
 * POST /api/ai/conversation
 */
export const validateConversationRequest = (req, res, next) => {
  const { words, suggestedSentences, selectedSentence } = req.body;

  // 입력 검증
  if (!words || !Array.isArray(words) || words.length === 0) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '낱말 배열이 필요합니다'
    });
  }

  if (!suggestedSentences || !Array.isArray(suggestedSentences)) {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '추천 문장 배열이 필요합니다'
    });
  }

  if (!selectedSentence || typeof selectedSentence !== 'string') {
    return res.status(400).error({
      code: 'INVALID_INPUT',
      message: '선택한 문장이 필요합니다'
    });
  }

  next();
};
