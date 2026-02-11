import axios from 'axios';
import asyncHandler from '../../common/utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { savePendingSignup } from '../services/token.service.js';
import { ValidationError } from '../../errors/app.error.js';

/**
 * 카카오 SDK 로그인
 * POST /api/auth/kakao/sdk
 * Body: { kakaoAccessToken }
 */
export const kakaoSdkLogin = asyncHandler(async (req, res) => {
  const { kakaoAccessToken } = req.body;

  if (!kakaoAccessToken) {
    throw new ValidationError('kakaoAccessToken이 필요합니다');
  }

  // 카카오 API로 사용자 정보 조회
  let kakaoUser;
  try {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` }
    });
    kakaoUser = response.data;
  } catch (err) {
    throw new ValidationError('유효하지 않은 카카오 토큰입니다');
  }

  const profile = {
    id: String(kakaoUser.id),
    email: kakaoUser.kakao_account?.email || null,
    nickname: kakaoUser.kakao_account?.profile?.nickname || null
  };

  const existingUser = await authService.checkExistingUser('KAKAO', profile.id);

  if (existingUser) {
    const result = await authService.loginExistingUser(existingUser);
    return res.success({
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        accountType: result.user.accountType
      },
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: result.tokens.expiresIn
      }
    }, '카카오 로그인 성공');
  }

  // 신규 가입자 → pendingToken 발급
  const pendingToken = await savePendingSignup('KAKAO', profile);
  return res.status(200).success({ pendingToken, provider: 'KAKAO' }, '약관 동의가 필요합니다');
});

/**
 * 구글 SDK 로그인
 * POST /api/auth/google/sdk
 * Body: { idToken }
 */
export const googleSdkLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ValidationError('idToken이 필요합니다');
  }

  // 구글 tokeninfo API로 검증
  let googleUser;
  try {
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    googleUser = response.data;
  } catch (err) {
    throw new ValidationError('유효하지 않은 구글 토큰입니다');
  }

  const profile = {
    id: googleUser.sub,
    email: googleUser.email || null,
    nickname: googleUser.name || null
  };

  const existingUser = await authService.checkExistingUser('GOOGLE', profile.id);

  if (existingUser) {
    const result = await authService.loginExistingUser(existingUser);
    return res.success({
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        accountType: result.user.accountType
      },
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: result.tokens.expiresIn
      }
    }, '구글 로그인 성공');
  }

  const pendingToken = await savePendingSignup('GOOGLE', profile);
  return res.status(200).success({ pendingToken, provider: 'GOOGLE' }, '약관 동의가 필요합니다');
});

/**
 * 네이버 SDK 로그인
 * POST /api/auth/naver/sdk
 * Body: { naverAccessToken }
 */
export const naverSdkLogin = asyncHandler(async (req, res) => {
  const { naverAccessToken } = req.body;

  if (!naverAccessToken) {
    throw new ValidationError('naverAccessToken이 필요합니다');
  }

  // 네이버 API로 사용자 정보 조회
  let naverUser;
  try {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${naverAccessToken}` }
    });
    naverUser = response.data.response;
  } catch (err) {
    throw new ValidationError('유효하지 않은 네이버 토큰입니다');
  }

  const profile = {
    id: String(naverUser.id),
    email: naverUser.email || null,
    nickname: naverUser.nickname || naverUser.name || null
  };

  const existingUser = await authService.checkExistingUser('NAVER', profile.id);

  if (existingUser) {
    const result = await authService.loginExistingUser(existingUser);
    return res.success({
      user: {
        id: result.user.id,
        nickname: result.user.nickname,
        accountType: result.user.accountType
      },
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: result.tokens.expiresIn
      }
    }, '네이버 로그인 성공');
  }

  const pendingToken = await savePendingSignup('NAVER', profile);
  return res.status(200).success({ pendingToken, provider: 'NAVER' }, '약관 동의가 필요합니다');
});
