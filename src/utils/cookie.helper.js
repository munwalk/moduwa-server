/**
 * 쿠키 설정 헬퍼 함수
 * HTTP-only 쿠키를 사용하여 Refresh Token을 안전하게 관리
 */

/**
 * Refresh Token을 httpOnly 쿠키로 설정
 * @param {Object} res - Express response 객체
 * @param {string} refreshToken - Refresh Token
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,           // JavaScript 접근 불가 (XSS 방어)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only (프로덕션)
    sameSite: 'lax',          // CSRF 방어
    maxAge: 14 * 24 * 60 * 60 * 1000,  // 14일 (밀리초)
    path: '/'
  });
};

/**
 * Refresh Token 쿠키 삭제
 * @param {Object} res - Express response 객체
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
};
