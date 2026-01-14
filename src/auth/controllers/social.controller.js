import asyncHandler from '../../common/utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { AuthResponseDto } from '../dto/response/auth.response.js';
import passport from '../middlewares/passport.config.js';

/**
 * 카카오 로그인 시작
 * GET /api/auth/kakao
 */
export const kakaoLogin = (req, res, next) => {
  passport.authenticate('kakao')(req, res, next);
};

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

      const result = await authService.socialLogin('KAKAO', profile);
      const responseDto = new AuthResponseDto(result.user, result.tokens);

      const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
        `accessToken=${responseDto.tokens.accessToken}&` +
        `refreshToken=${responseDto.tokens.refreshToken}&` +
        `userId=${responseDto.user.id}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Kakao login error:', error);
      
      let errorCode = 'login_failed';
      if (error.message === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
        errorCode = 'account_already_linked';
      }
      
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=${errorCode}`);
    }
  })(req, res);
});

/**
 * 구글 로그인 시작
 * GET /api/auth/google
 */
export const googleLogin = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

/**
 * 구글 로그인 콜백
 * GET /api/auth/google/callback
 */
export const googleCallback = asyncHandler(async (req, res) => {
  passport.authenticate('google', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) {
        console.error('Google auth error:', err);
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=google_auth_failed`);
      }

      const result = await authService.socialLogin('GOOGLE', profile);
      const responseDto = new AuthResponseDto(result.user, result.tokens);

      const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
        `accessToken=${responseDto.tokens.accessToken}&` +
        `refreshToken=${responseDto.tokens.refreshToken}&` +
        `userId=${responseDto.user.id}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorCode = 'login_failed';
      if (error.message === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
        errorCode = 'account_already_linked';
      }
      
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=${errorCode}`);
    }
  })(req, res);
});

/**
 * 네이버 로그인 시작
 * GET /api/auth/naver
 */
export const naverLogin = (req, res, next) => {
  passport.authenticate('naver')(req, res, next);
};

/**
 * 네이버 로그인 콜백
 * GET /api/auth/naver/callback
 */
export const naverCallback = asyncHandler(async (req, res) => {
  passport.authenticate('naver', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) {
        console.error('Naver auth error:', err);
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=naver_auth_failed`);
      }

      const result = await authService.socialLogin('NAVER', profile);
      const responseDto = new AuthResponseDto(result.user, result.tokens);

      const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?` +
        `accessToken=${responseDto.tokens.accessToken}&` +
        `refreshToken=${responseDto.tokens.refreshToken}&` +
        `userId=${responseDto.user.id}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Naver login error:', error);
      
      let errorCode = 'login_failed';
      if (error.message === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
        errorCode = 'account_already_linked';
      }
      
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=${errorCode}`);
    }
  })(req, res);
});