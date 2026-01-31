import asyncHandler from '../../common/utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { verifyToken } from '../services/jwt.service.js';
import { getRefreshToken, deleteRefreshToken, addToBlacklist } from '../services/token.service.js';
import { AuthResponseDto, TokenRefreshResponseDto } from '../dto/response/auth.response.js';
import { UserDetailResponseDto, ConvertAccountResponseDto } from '../dto/response/user.response.js';
import * as createGuestDto from '../dto/request/createGuest.dto.js';
import * as convertToSocialDto from '../dto/request/convertToSocial.dto.js';
import * as refreshTokenDto from '../dto/request/refreshToken.dto.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../../utils/cookie.helper.js';
import { InvalidRefreshTokenError } from '../../errors/app.error.js';

/**
 * 게스트 계정 생성
 * POST /api/auth/guest
 */
export const createGuest = asyncHandler(async (req, res) => {
  const validatedData = createGuestDto.validate(req.body);
  const result = await authService.createGuestAccount(validatedData.deviceId);

  // refreshToken은 httpOnly 쿠키로 설정
  setRefreshTokenCookie(res, result.tokens.refreshToken);

  // 응답에는 accessToken만 포함
  const responseDto = {
    user: {
      id: result.user.id,
      nickname: result.user.nickname,
      accountType: result.user.accountType
    },
    tokens: {
      accessToken: result.tokens.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.tokens.expiresIn
    }
  };

  return res.status(201).success(responseDto, 'Guest account created successfully');
});

/**
 * 게스트 → 소셜 계정 전환
 * POST /api/auth/guest/convert
 */
export const convertToSocial = asyncHandler(async (req, res) => {
  const validatedData = convertToSocialDto.validate(req.body);
  const { userId } = req.user;

  const user = await authService.convertGuestToSocial(
    userId,
    validatedData.provider,
    validatedData.profile
  );

  const responseDto = new ConvertAccountResponseDto(user);

  return res.success(responseDto, 'Account converted successfully');
});

/**
 * Token 갱신
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // 쿠키에서 refreshToken 읽기
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    throw new InvalidRefreshTokenError('Refresh token not found');
  }

  const decoded = verifyToken(refreshTokenFromCookie);
  const storedToken = await getRefreshToken(decoded.userId);

  if (!storedToken || storedToken !== refreshTokenFromCookie) {
    throw new InvalidRefreshTokenError();
  }

  const tokens = await authService.generateTokens(decoded.userId, decoded.accountType);

  // 새로운 refreshToken을 쿠키로 설정
  setRefreshTokenCookie(res, tokens.refreshToken);

  // accessToken만 응답
  const responseDto = {
    accessToken: tokens.accessToken,
    tokenType: 'Bearer',
    expiresIn: tokens.expiresIn
  };

  return res.success(responseDto, 'Token refreshed successfully');
});

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);

  await deleteRefreshToken(userId);
  await addToBlacklist(token, 3600);

  // refreshToken 쿠키 삭제
  clearRefreshTokenCookie(res);

  return res.success(null, 'Logged out successfully');
});

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const result = await authService.getUserById(userId);

  const responseDto = new UserDetailResponseDto(
    result.user,
    result.settings,
    result.subscription
  );

  return res.success(responseDto, 'User retrieved successfully');
});