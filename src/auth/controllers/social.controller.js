import asyncHandler from '../../common/utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { AuthResponseDto } from '../dto/response/auth.response.js';
import passport from '../middlewares/passport.config.js';
import { savePendingSignup } from '../services/token.service.js';
import { setRefreshTokenCookie } from '../../utils/cookie.helper.js';

/**
 * 카카오 로그인 콜백
 * GET /api/auth/kakao/callback
 */
export const kakaoCallback = asyncHandler(async (req, res) => {
  passport.authenticate('kakao', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) {
        console.error('Kakao auth error:', err);
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=kakao_auth_failed`);
      }

      // 기존 회원인지 확인
      const existingUser = await authService.checkExistingUser('KAKAO', profile.id);

      if (existingUser) {
        // 기존 회원 → 바로 로그인 처리
        const result = await authService.loginExistingUser(existingUser);
        const responseDto = new AuthResponseDto(result.user, result.tokens);

        // refreshToken은 httpOnly 쿠키로 설정
        setRefreshTokenCookie(res, responseDto.tokens.refreshToken);

        // accessToken과 userId만 URL로 전달
        const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
          `accessToken=${responseDto.tokens.accessToken}&` +
          `userId=${responseDto.user.id}`;

        return res.redirect(redirectUrl);
      } else {
        // 신규 가입자 → 약관 동의 페이지로 이동
        // 임시 토큰 생성 (5분 유효)
        const pendingToken = await savePendingSignup('KAKAO', profile);

        const redirectUrl = `${process.env.CORS_ORIGIN}/terms?` +
          `pendingToken=${pendingToken}&` +
          `provider=KAKAO`;

        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Kakao login error:', error);
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=login_failed`);
    }
  })(req, res);
});

/**
 * 구글 로그인 콜백
 */
export const googleCallback = asyncHandler(async (req, res) => {
  passport.authenticate('google', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=google_auth_failed`);
      }

      const existingUser = await authService.checkExistingUser('GOOGLE', profile.id);

      if (existingUser) {
        const result = await authService.loginExistingUser(existingUser);
        const responseDto = new AuthResponseDto(result.user, result.tokens);

        // refreshToken은 httpOnly 쿠키로 설정
        setRefreshTokenCookie(res, responseDto.tokens.refreshToken);

        // accessToken과 userId만 URL로 전달
        const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
          `accessToken=${responseDto.tokens.accessToken}&` +
          `userId=${responseDto.user.id}`;

        return res.redirect(redirectUrl);
      } else {
        const pendingToken = await savePendingSignup('GOOGLE', profile);

        const redirectUrl = `${process.env.CORS_ORIGIN}/terms?` +
          `pendingToken=${pendingToken}&` +
          `provider=GOOGLE`;

        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Google login error:', error);
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=login_failed`);
    }
  })(req, res);
});

/**
 * 네이버 로그인 콜백
 */
export const naverCallback = asyncHandler(async (req, res) => {
  passport.authenticate('naver', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) {
        console.error('Naver auth error:', err);
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=naver_auth_failed`);
      }

      const existingUser = await authService.checkExistingUser('NAVER', profile.id);

      if (existingUser) {
        const result = await authService.loginExistingUser(existingUser);
        const responseDto = new AuthResponseDto(result.user, result.tokens);

        // refreshToken은 httpOnly 쿠키로 설정
        setRefreshTokenCookie(res, responseDto.tokens.refreshToken);

        // accessToken과 userId만 URL로 전달
        const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
          `accessToken=${responseDto.tokens.accessToken}&` +
          `userId=${responseDto.user.id}`;

        return res.redirect(redirectUrl);
      } else {
        const pendingToken = await savePendingSignup('NAVER', profile);

        const redirectUrl = `${process.env.CORS_ORIGIN}/terms?` +
          `pendingToken=${pendingToken}&` +
          `provider=NAVER`;

        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Naver login error:', error);
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=login_failed`);
    }
  })(req, res);
});

// 카카오, 구글, 네이버 로그인 시작은 기존과 동일
export const kakaoLogin = (req, res, next) => {
  passport.authenticate('kakao')(req, res, next);
};

export const googleLogin = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

export const naverLogin = (req, res, next) => {
  passport.authenticate('naver')(req, res, next);
};