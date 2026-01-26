import asyncHandler from '../../common/utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { verifyToken } from '../services/jwt.service.js';
import { getRefreshToken, deleteRefreshToken, addToBlacklist } from '../services/token.service.js';
import { AuthResponseDto, TokenRefreshResponseDto } from '../dto/response/auth.response.js';
import { UserDetailResponseDto, ConvertAccountResponseDto } from '../dto/response/user.response.js';
import * as createGuestDto from '../dto/request/createGuest.dto.js';
import * as convertToSocialDto from '../dto/request/convertToSocial.dto.js';
import * as refreshTokenDto from '../dto/request/refreshToken.dto.js';

/**
 * 게스트 계정 생성
 * POST /api/auth/guest
 */
export const createGuest = asyncHandler(async (req, res) => {
  const validatedData = createGuestDto.validate(req.body);
  const result = await authService.createGuestAccount(validatedData.deviceId);
  const responseDto = new AuthResponseDto(result.user, result.tokens);

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
  const validatedData = refreshTokenDto.validate(req.body);
  const decoded = verifyToken(validatedData.refreshToken);
  const storedToken = await getRefreshToken(decoded.userId);

  if (!storedToken || storedToken !== validatedData.refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: { code: 'INVALID_REFRESH_TOKEN' }
    });
  }

  const tokens = await authService.generateTokens(decoded.userId, decoded.accountType);
  const responseDto = new TokenRefreshResponseDto(tokens);

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