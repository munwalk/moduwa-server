/**
 * DTO 검증 미들웨어 팩토리
 */
export const validate = (dtoValidator) => {
  return (req, res, next) => {
    try {
      const validatedData = dtoValidator.validate(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).error({
        code: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  };
};

/**
 * Query 파라미터 검증 미들웨어
 */
export const validateQuery = (dtoValidator) => {
  return (req, res, next) => {
    try {
      const validatedData = dtoValidator.validate(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      return res.status(400).error({
        code: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  };
};

/**
 * Params 검증 미들웨어
 */
export const validateParams = (dtoValidator) => {
  return (req, res, next) => {
    try {
      const validatedData = dtoValidator.validate(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      return res.status(400).error({
        code: 'VALIDATION_ERROR',
        message: error.message
      });
    }
  };
};