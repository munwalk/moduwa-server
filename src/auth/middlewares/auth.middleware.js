import { verifyToken } from '../services/jwt.service.js';
import { isBlacklisted } from '../services/token.service.js';
import {
  UnauthorizedError,
  InvalidTokenError,
  TokenExpiredError,
  NotGuestAccountError,
  ForbiddenError
} from '../../errors/app.error.js';

/**
 * JWT 인증 미들웨어
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.substring(7);

    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    const decoded = verifyToken(token);

    // id와 userId 둘 다 지원 (호환성)
    const actualId = decoded.userId || decoded.id;
    if (!actualId) {
      throw new InvalidTokenError('User ID not found in token');
    }

    req.user = {
      userId: actualId,
      accountType: decoded.accountType
    };

    next();
  } catch (error) {
    // 이미 우리가 만든 에러 클래스라면 그대로 전달
    if (error.isOperational) {
      return next(error);
    }
    // jwt.service.js에서 던지는 에러 처리
    if (error.message === 'TOKEN_EXPIRED') {
      return next(new TokenExpiredError('Access token expired'));
    }
    if (error.message === 'INVALID_TOKEN') {
      return next(new InvalidTokenError('Invalid access token'));
    }
    return next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * 선택적 인증 미들웨어 (토큰 없어도 통과)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // id와 userId 둘 다 지원 (호환성)
    const actualId = decoded.userId || decoded.id;

    req.user = {
      userId: actualId,
      accountType: decoded.accountType
    };

    next();
  } catch (error) {
    next();
  }
};

/**
 * GUEST 계정만 허용
 */
export const guestOnly = (req, res, next) => {
  if (req.user.accountType !== 'GUEST') {
    return next(new NotGuestAccountError('Only guest accounts can access this'));
  }
  next();
};

/**
 * SOCIAL 계정만 허용
 */
export const socialOnly = (req, res, next) => {
  if (req.user.accountType !== 'SOCIAL') {
    return next(new ForbiddenError('Only social accounts can access this'));
  }
  next();
};
