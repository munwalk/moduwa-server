import Joi from 'joi';

/**
 * AI 문장 예측 요청 검증 스키마
 *
 * 변경 이력:
 * - 키보드 기능 삭제 (typedText 제거)
 * - 낱말 카드 MIN 1 / MAX 10
 */
const predictRequestSchema = Joi.object({
  words: Joi.array()
    // trim()을 추가하여 " " 같은 공백 입력을 원천 차단
    .items(Joi.string().trim().min(1).max(50))
    .min(1) // 최소 1개 필수
    .max(10) // 최대 10개
    .required(),
  context: Joi.object({
    currentTime: Joi.string().optional(),
    previousMessages: Joi.array().items(Joi.string()).optional()
  }).optional(),
  // refresh 필드를 허용하고 기본값을 false로 설정
  refresh: Joi.boolean().default(false) 
}).options({ stripUnknown: true });

export { predictRequestSchema };