import Joi from 'joi';

export const completeSocialSignupSchema = Joi.object({
  pendingToken: Joi.string().required(),
  agreements: Joi.array().items(
    Joi.object({
      termsId: Joi.string().uuid().required(),
      isAgreed: Joi.boolean().required()
    })
  ).min(1).required()
});

export const validate = (data) => {
  const { error, value } = completeSocialSignupSchema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};