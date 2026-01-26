/**
 * 성공 응답
 */
export const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 에러 응답
 */
export const error = (res, message = 'Error', statusCode = 500, errorCode = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode || `ERROR_${statusCode}`,
      message
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 인증 에러 (401)
 */
export const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401, 'UNAUTHORIZED');
};

/**
 * 권한 에러 (403)
 */
export const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403, 'FORBIDDEN');
};

/**
 * Not Found (404)
 */
export const notFound = (res, message = 'Not found') => {
  return error(res, message, 404, 'NOT_FOUND');
};

/**
 * Validation 에러 (400)
 */
export const validationError = (res, message = 'Validation failed') => {
  return error(res, message, 400, 'VALIDATION_ERROR');
};

/**
 * Conflict (409)
 */
export const conflict = (res, message = 'Conflict') => {
  return error(res, message, 409, 'CONFLICT');
};

/**
 * Internal Server Error (500)
 */
export const internalError = (res, message = 'Internal server error') => {
  return error(res, message, 500, 'INTERNAL_ERROR');
};

export const successResponse = success;
export const errorResponse = error;