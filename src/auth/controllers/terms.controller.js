import asyncHandler from '../../common/utils/asyncHandler.js';
import * as termsService from '../services/terms.service.js';
import { successResponse } from '../../common/utils/response.js';
import { TermsResponseDto, TermsAgreementResponseDto } from '../dto/response/terms.response.js';
import { setRefreshTokenCookie } from '../../utils/cookie.helper.js';

/**
 * 약관 목록 조회 (필수/선택 구분)
 * GET /api/auth/terms
 */
export const getTermsList = asyncHandler(async (req, res) => {
  const terms = await termsService.getActiveTerms();
  const responseDto = terms.map(term => new TermsResponseDto(term));

  return successResponse(res, responseDto, '약관 목록 조회 성공');
});

/**
 * 소셜 로그인 후 약관 동의 + 회원가입 완료
 * POST /api/auth/social/complete
 */
export const completeSocialSignup = asyncHandler(async (req, res) => {
  const { pendingToken, agreements } = req.body;

  if (!pendingToken) {
    return res.status(400).json({
      success: false,
      message: 'pendingToken이 필요합니다',
      error: { code: 'MISSING_PENDING_TOKEN' }
    });
  }

  const result = await termsService.completeSocialSignupWithTerms(pendingToken, agreements);

  // refreshToken은 httpOnly 쿠키로 설정
  if (result.tokens) {
    setRefreshTokenCookie(res, result.tokens.refreshToken);
  }

  // 응답에는 accessToken만 포함
  const responseDto = {
    user: {
      id: result.user.id,
      nickname: result.user.nickname,
      email: result.user.email,
      accountType: result.user.accountType
    },
    tokens: {
      accessToken: result.tokens.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.tokens.expiresIn
    },
    agreementsCount: result.agreementsCount
  };

  return successResponse(res, responseDto, '회원가입이 완료되었습니다', 201);
});

/**
 * 약관 동의
 * POST /api/auth/terms/agree
 */
export const agreeToTerms = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { agreements } = req.body;

  const result = await termsService.createTermsAgreements(userId, agreements);
  const responseDto = new TermsAgreementResponseDto(result);

  return successResponse(res, responseDto, '약관 동의가 완료되었습니다', 201);
});

/**
 * 내 약관 동의 내역 조회
 * GET /api/auth/terms/my
 */
export const getMyTermsAgreements = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const agreements = await termsService.getUserTermsAgreements(userId);

  return successResponse(res, agreements, '약관 동의 내역 조회 성공');
});

/**
 * 약관 동의 철회 (선택 약관만)
 * DELETE /api/auth/terms/:termsId
 */
export const revokeTermsAgreement = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { termsId } = req.params;

  await termsService.revokeTermsAgreement(userId, termsId);

  return successResponse(res, null, '약관 동의가 철회되었습니다');
});