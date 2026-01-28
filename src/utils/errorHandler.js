import {
  AiPredictionTimeoutError,
  UnauthorizedError,
  TokenExpiredError,
  InvalidTokenError,
  UserNotFoundError,
  NotGuestAccountError,
  SocialAccountAlreadyLinkedError,
  InvalidRefreshTokenError,
  ValidationError
} from '../errors/app.error.js';

/**
 * 전역 에러 핸들러
 * 모든 에러를 일관된 형식으로 처리
 */
const errorHandler = (err, req, res, next) => {
  // 이미 응답 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

  // Auth 에러 처리
  if (err.message === 'USER_NOT_FOUND') {
    const error = new UserNotFoundError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  if (err.message === 'TOKEN_EXPIRED') {
    const error = new TokenExpiredError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  if (err.message === 'INVALID_TOKEN') {
    const error = new InvalidTokenError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  if (err.message === 'NOT_GUEST_ACCOUNT') {
    const error = new NotGuestAccountError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  if (err.message === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
    const error = new SocialAccountAlreadyLinkedError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  if (err.message === 'INVALID_REFRESH_TOKEN') {
    const error = new InvalidRefreshTokenError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  // Validation 에러
  if (err.message && err.message.includes('Validation error:')) {
    const error = new ValidationError(err.message);
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  // Prisma 에러 처리
  if (err.code === 'P2002') {
    return res.status(409).error({
      code: 'DUPLICATE_ENTRY',
      message: '중복된 데이터입니다'
    });
  }

  if (err.code === 'P2025') {
    const error = new UserNotFoundError();
    return res.status(error.statusCode).error({
      code: error.code,
      message: error.message
    });
  }

  // 운영 에러 (예측 가능한 에러)
  if (err.isOperational) {
    return res.status(err.statusCode).error({
      code: err.code,
      message: err.message,
      detail: err.detail || null
    });
  }

  // 프로그래밍 에러
  console.error('ERROR:', err);
  return res.status(500).error({
    code: 'SERVER_ERROR',
    message: '서버 내부 오류가 발생했습니다',
    detail: process.env.NODE_ENV === 'development' ? err.message : null
  });
};

export default errorHandler;
