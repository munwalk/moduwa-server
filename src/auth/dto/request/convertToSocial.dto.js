import Joi from 'joi';

export const convertToSocialSchema = Joi.object({
  provider: Joi.string().valid('KAKAO', 'GOOGLE', 'NAVER').required(),
  profile: Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().optional().allow(null),
    nickname: Joi.string().optional().allow(null)
  }).required()
});

export const validate = (data) => {
  const { error, value } = convertToSocialSchema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};