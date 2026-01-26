import Joi from 'joi';

export const createGuestSchema = Joi.object({
  deviceId: Joi.string().optional().max(255)
});

export const validate = (data) => {
  const { error, value } = createGuestSchema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }
  return value;
};