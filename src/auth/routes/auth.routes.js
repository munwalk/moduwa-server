import express from 'express';
const router = express.Router();

import * as guestController from '../controllers/guest.controller.js';
import * as socialController from '../controllers/social.controller.js';
import { authenticate, guestOnly } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import * as createGuestDto from '../dto/request/createGuest.dto.js';
import * as convertToSocialDto from '../dto/request/convertToSocial.dto.js';

import * as accountController from '../controllers/account.controller.js';
import * as termsController from '../controllers/terms.controller.js';
import * as termsAgreementDto from '../dto/request/termsAgreement.dto.js';
import * as completeSocialSignupDto from '../dto/request/completeSocialSignup.dto.js';
// ==========================================
// 게스트 계정
// ==========================================

/**
 * 게스트 계정 생성
 * POST /api/auth/guest
 */
router.post(
  '/guest',
  validate(createGuestDto),
  guestController.createGuest
);

/**
 * 게스트 → 소셜 계정 전환
 * POST /api/auth/guest/convert
 */
router.post(
  '/guest/convert',
  authenticate,
  guestOnly,
  validate(convertToSocialDto),
  guestController.convertToSocial
);

// ==========================================
// 토큰 관리
// ==========================================

/**
 * Token 갱신
 * POST /api/auth/refresh
 * refreshToken은 쿠키로 전송되므로 body validation 불필요
 */
router.post(
  '/refresh',
  guestController.refreshToken
);

/**
 * 로그아웃
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticate,
  guestController.logout
);

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
router.get(
  '/me',
  authenticate,
  guestController.getMe
);

// ==========================================
// 카카오 로그인
// ==========================================

router.get('/kakao', socialController.kakaoLogin);
router.get('/kakao/callback', socialController.kakaoCallback);

// ==========================================
// 구글 로그인
// ==========================================

router.get('/google', socialController.googleLogin);
router.get('/google/callback', socialController.googleCallback);

// ==========================================
// 네이버 로그인
// ==========================================

router.get('/naver', socialController.naverLogin);
router.get('/naver/callback', socialController.naverCallback);

// ==========================================
// 회원탈퇴
// ==========================================

/**
 * 회원탈퇴
 * DELETE /api/auth/account
 */
router.delete(
  '/account',
  authenticate,
  accountController.deleteAccount
);


// ==========================================
// 약관 관리
// ==========================================

/**
 * 약관 목록 조회
 * GET /api/auth/terms
 */
router.get(
  '/terms',
  termsController.getTermsList
);

/**
 * 소셜 로그인 후 약관 동의 + 회원가입 완료 
 * POST /api/auth/social/complete
 */
router.post(
  '/social/complete',
  validate(completeSocialSignupDto),
  termsController.completeSocialSignup
);

/**
 * 약관 동의 (게스트 전환용)
 * POST /api/auth/terms/agree
 */
router.post(
  '/terms/agree',
  authenticate,
  validate(termsAgreementDto),
  termsController.agreeToTerms
);
 
export default router;