import Joi from 'joi';

/**
 * AI 문장 예측 요청 검증 스키마
 *
 * 변경 이력:
 * - 키보드 기능 삭제 (typedText 제거)
 * - 낱말 카드 MIN 1 / MAX 15으로 변경
 */
const predictRequestSchema = Joi.object({
  words: Joi.array()
    .items(Joi.string().min(1).max(50))
    .min(1) // 최소 1개 필수
    .max(15) // 최대 15개
    .required(),
  context: Joi.object({
    currentTime: Joi.string().optional(),
    previousMessages: Joi.array().items(Joi.string()).optional()
  }).optional()
}).options({ stripUnknown: true });

export { predictRequestSchema };