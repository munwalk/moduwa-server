import Joi from 'joi';

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const validate = (data) => {
  const { error, value } = refreshTokenSchema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};