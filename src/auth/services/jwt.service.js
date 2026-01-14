import jwt from 'jsonwebtoken';

/**
 * Access Token 생성
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h'
  });
};

/**
 * Refresh Token 생성
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d'
  });
};

/**
 * Token 검증
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('INVALID_TOKEN');
  }
};

/**
 * Token에서 payload 추출 (검증 없이)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};