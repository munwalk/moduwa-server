import { verifyToken } from '../services/jwt.service.js';
import { isBlacklisted } from '../services/token.service.js';

/**
 * JWT 인증 미들웨어
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).error({
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);

    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).error({
        code: 'UNAUTHORIZED',
        message: 'Token has been revoked'
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      accountType: decoded.accountType
    };

    next();
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).error({
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired'
      });
    }
    if (error.message === 'INVALID_TOKEN') {
      return res.status(401).error({
        code: 'INVALID_TOKEN',
        message: 'Invalid access token'
      });
    }
    return res.status(401).error({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed'
    });
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

    req.user = {
      userId: decoded.userId,
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
    return res.status(403).error({
      code: 'NOT_GUEST_ACCOUNT',
      message: 'Only guest accounts can access this'
    });
  }
  next();
};

/**
 * SOCIAL 계정만 허용
 */
export const socialOnly = (req, res, next) => {
  if (req.user.accountType !== 'SOCIAL') {
    return res.status(403).error({
      code: 'NOT_SOCIAL_ACCOUNT',
      message: 'Only social accounts can access this'
    });
  }
  next();
};