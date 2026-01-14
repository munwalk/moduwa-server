import express from 'express';
const router = express.Router();

import * as guestController from '../controllers/guest.controller.js';
import * as socialController from '../controllers/social.controller.js';
import { authenticate, guestOnly } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';

import * as createGuestDto from '../dto/request/createGuest.dto.js';
import * as convertToSocialDto from '../dto/request/convertToSocial.dto.js';
import * as refreshTokenDto from '../dto/request/refreshToken.dto.js';

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
 */
router.post(
  '/refresh',
  validate(refreshTokenDto),
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

export default router;