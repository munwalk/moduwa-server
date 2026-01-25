import Joi from 'joi';

export const termsAgreementSchema = Joi.object({
  agreements: Joi.array().items(
    Joi.object({
      termsId: Joi.string().uuid().required(),
      isAgreed: Joi.boolean().required()
    })
  ).min(1).required()
});

export const validate = (data) => {
  const { error, value } = termsAgreementSchema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};