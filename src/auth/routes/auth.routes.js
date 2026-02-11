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
import * as completeSocialSignupDto from '../dto/request/completeSocialSignup.dto.js';
import * as sdkController from '../controllers/sdk.controller.js';
// ==========================================
// 게스트 계정
// ==========================================

/**
 * @swagger
 * /api/auth/guest:
 *   post:
 *     summary: 게스트 계정 생성
 *     description: 로그인 없이 즉시 서비스를 체험할 수 있는 게스트 계정을 생성합니다. accessToken과 refreshToken(httpOnly 쿠키)을 발급합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 maxLength: 255
 *                 description: 기기 식별자 (선택사항)
 *                 example: "device-uuid-1234"
 *     responses:
 *       201:
 *         description: 게스트 계정 생성 성공
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken (httpOnly, 14일 유효)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "uuid-1234"
 *                         nickname:
 *                           type: string
 *                           example: "게스트9821"
 *                         accountType:
 *                           type: string
 *                           enum: [GUEST]
 *                           example: "GUEST"
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: "eyJhbGci..."
 *                         tokenType:
 *                           type: string
 *                           example: "Bearer"
 *                         expiresIn:
 *                           type: integer
 *                           example: 3600
 *                 message:
 *                   type: string
 *                   example: "Guest account created successfully"
 *       400:
 *         description: 유효성 검사 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/guest',
  validate(createGuestDto),
  guestController.createGuest
);

/**
 * @swagger
 * /api/auth/guest/convert:
 *   post:
 *     summary: 게스트 → 소셜 계정 전환 (약관 동의 포함)
 *     description: 게스트 계정을 소셜 계정으로 전환합니다. 서비스 이용약관과 개인정보 처리방침 두 개 모두 동의 필수이며, 기존 게스트 데이터는 모두 유지됩니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - profile
 *               - agreements
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [KAKAO, GOOGLE, NAVER]
 *                 example: "KAKAO"
 *               profile:
 *                 type: object
 *                 required:
 *                   - id
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 소셜 제공자 사용자 ID
 *                     example: "kakao-user-12345"
 *                   email:
 *                     type: string
 *                     format: email
 *                     nullable: true
 *                     example: "user@kakao.com"
 *                   nickname:
 *                     type: string
 *                     nullable: true
 *                     example: "카카오닉네임"
 *               agreements:
 *                 type: array
 *                 description: 필수 약관 2개 모두 동의 필수 (서비스 이용약관 + 개인정보 처리방침)
 *                 minItems: 2
 *                 example:
 *                   - termsId: "550e8400-e29b-41d4-a716-446655440001"
 *                     isAgreed: true
 *                   - termsId: "550e8400-e29b-41d4-a716-446655440002"
 *                     isAgreed: true
 *                 items:
 *                   type: object
 *                   required:
 *                     - termsId
 *                     - isAgreed
 *                   properties:
 *                     termsId:
 *                       type: string
 *                       format: uuid
 *                     isAgreed:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: 계정 전환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "uuid-1234"
 *                     nickname:
 *                       type: string
 *                       example: "카카오닉네임"
 *                     email:
 *                       type: string
 *                       example: "user@kakao.com"
 *                     accountType:
 *                       type: string
 *                       enum: [SOCIAL]
 *                       example: "SOCIAL"
 *                 message:
 *                   type: string
 *                   example: "Account converted successfully"
 *       400:
 *         description: 유효성 검사 실패 또는 필수 약관 미동의
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation:
 *                 summary: agreements 누락
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "agreements이 필요합니다"
 *               termsRequired:
 *                 summary: 필수 약관 미동의
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "필수 약관에 동의해야 합니다"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: 게스트 계정이 아님
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH006"
 *                 message: "게스트 계정만 수행할 수 있습니다"
 *       409:
 *         description: 이미 연동된 소셜 계정
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH007"
 *                 message: "이미 다른 계정과 연동된 소셜 계정입니다"
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
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     description: refreshToken(httpOnly 쿠키)을 사용하여 새로운 accessToken을 발급받습니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: refreshToken (httpOnly 쿠키로 자동 전송)
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         headers:
 *           Set-Cookie:
 *             description: 새로운 refreshToken (httpOnly, 14일 유효)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGci..."
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *                     expiresIn:
 *                       type: integer
 *                       example: 3600
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *       401:
 *         description: refreshToken 없음 또는 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH008"
 *                 message: "유효하지 않은 리프레시 토큰입니다"
 */
router.post(
  '/refresh',
  guestController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: refreshToken을 삭제하고 accessToken을 블랙리스트에 추가합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken 쿠키 삭제
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: "null"
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/logout',
  authenticate,
  guestController.logout
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 현재 로그인한 사용자의 정보(user + settings + subscription)를 조회합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "uuid-1234"
 *                     nickname:
 *                       type: string
 *                       example: "게스트9821"
 *                     email:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     accountType:
 *                       type: string
 *                       enum: [GUEST, SOCIAL]
 *                       example: "GUEST"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     settings:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         ttsVoiceType:
 *                           type: string
 *                           example: "FEMALE"
 *                         ttsAgeType:
 *                           type: string
 *                           example: "YOUNG"
 *                         ttsTone:
 *                           type: string
 *                           example: "NEUTRAL"
 *                         gridColumns:
 *                           type: integer
 *                           example: 4
 *                     subscription:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         planType:
 *                           type: string
 *                           example: "FREE"
 *                         status:
 *                           type: string
 *                           example: "ACTIVE"
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/me',
  authenticate,
  guestController.getMe
);

// ==========================================
// 카카오 로그인
// ==========================================

/**
 * @swagger
 * /api/auth/kakao:
 *   get:
 *     summary: 카카오 로그인 시작
 *     description: 카카오 OAuth2 인증 페이지로 리다이렉트합니다.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 카카오 로그인 페이지로 리다이렉트
 */
router.get('/kakao', socialController.kakaoLogin);

/**
 * @swagger
 * /api/auth/kakao/callback:
 *   get:
 *     summary: 카카오 로그인 콜백
 *     description: 카카오 OAuth2 인증 후 콜백을 처리합니다. 기존 사용자는 토큰 발급, 신규 사용자는 pendingToken 발급 후 약관 동의 화면으로 이동합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 카카오에서 발급한 인증 코드
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF 방지를 위한 state 파라미터
 *     responses:
 *       302:
 *         description: 성공 시 클라이언트 앱으로 리다이렉트
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken (httpOnly, 기존 사용자만)
 *             schema:
 *               type: string
 *           Location:
 *             description: 리다이렉트 URL (accessToken 또는 pendingToken 포함)
 *             schema:
 *               type: string
 *               example: "myapp://auth/callback?accessToken=eyJhbGci... (기존 사용자) 또는 myapp://auth/terms?pendingToken=eyJhbGci... (신규 사용자)"
 *       400:
 *         description: 인증 코드 누락 또는 카카오 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/kakao/callback', socialController.kakaoCallback);

// ==========================================
// 구글 로그인
// ==========================================

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: 구글 로그인 시작
 *     description: 구글 OAuth2 인증 페이지로 리다이렉트합니다.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 구글 로그인 페이지로 리다이렉트
 */
router.get('/google', socialController.googleLogin);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: 구글 로그인 콜백
 *     description: 구글 OAuth2 인증 후 콜백을 처리합니다. 기존 사용자는 토큰 발급, 신규 사용자는 pendingToken 발급 후 약관 동의 화면으로 이동합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 구글에서 발급한 인증 코드
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF 방지를 위한 state 파라미터
 *     responses:
 *       302:
 *         description: 성공 시 클라이언트 앱으로 리다이렉트
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken (httpOnly, 기존 사용자만)
 *             schema:
 *               type: string
 *           Location:
 *             description: 리다이렉트 URL (accessToken 또는 pendingToken 포함)
 *             schema:
 *               type: string
 *               example: "myapp://auth/callback?accessToken=eyJhbGci... (기존 사용자) 또는 myapp://auth/terms?pendingToken=eyJhbGci... (신규 사용자)"
 *       400:
 *         description: 인증 코드 누락 또는 구글 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google/callback', socialController.googleCallback);

// ==========================================
// 네이버 로그인
// ==========================================

/**
 * @swagger
 * /api/auth/naver:
 *   get:
 *     summary: 네이버 로그인 시작
 *     description: 네이버 OAuth2 인증 페이지로 리다이렉트합니다.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: 네이버 로그인 페이지로 리다이렉트
 */
router.get('/naver', socialController.naverLogin);

/**
 * @swagger
 * /api/auth/naver/callback:
 *   get:
 *     summary: 네이버 로그인 콜백
 *     description: 네이버 OAuth2 인증 후 콜백을 처리합니다. 기존 사용자는 토큰 발급, 신규 사용자는 pendingToken 발급 후 약관 동의 화면으로 이동합니다.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 네이버에서 발급한 인증 코드
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: CSRF 방지를 위한 state 파라미터
 *     responses:
 *       302:
 *         description: 성공 시 클라이언트 앱으로 리다이렉트
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken (httpOnly, 기존 사용자만)
 *             schema:
 *               type: string
 *           Location:
 *             description: 리다이렉트 URL (accessToken 또는 pendingToken 포함)
 *             schema:
 *               type: string
 *               example: "myapp://auth/callback?accessToken=eyJhbGci... (기존 사용자) 또는 myapp://auth/terms?pendingToken=eyJhbGci... (신규 사용자)"
 *       400:
 *         description: 인증 코드 누락 또는 네이버 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/naver/callback', socialController.naverCallback);

// ==========================================
// 회원탈퇴
// ==========================================

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: 회원탈퇴
 *     description: 현재 로그인한 사용자의 계정을 삭제합니다. 모든 관련 데이터(낱말, 카테고리, 대화, 즐겨찾기 등)가 함께 삭제됩니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원탈퇴 성공
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken 쿠키 삭제
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: "null"
 *                   example: null
 *                 message:
 *                   type: string
 *                   example: "Account deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @swagger
 * /api/auth/terms:
 *   get:
 *     summary: 약관 목록 조회
 *     description: 서비스 이용약관 및 개인정보 처리방침 등 모든 약관 목록을 조회합니다. 회원가입 시 약관 동의 화면에서 사용합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 약관 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "550e8400-e29b-41d4-a716-446655440001"
 *                       type:
 *                         type: string
 *                         enum: [SERVICE, PRIVACY, MARKETING]
 *                         example: "SERVICE"
 *                       title:
 *                         type: string
 *                         example: "서비스 이용약관"
 *                       content:
 *                         type: string
 *                         example: "제1조 (목적)\\n본 약관은..."
 *                       isRequired:
 *                         type: boolean
 *                         example: true
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       version:
 *                         type: string
 *                         example: "1.0.0"
 *                       effectiveDate:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: "Terms retrieved successfully"
 */
router.get(
  '/terms',
  termsController.getTermsList
);

/**
 * @swagger
 * /api/auth/social/complete:
 *   post:
 *     summary: 소셜 로그인 후 약관 동의 + 회원가입 완료
 *     description: 신규 소셜 사용자가 약관에 동의하고 회원가입을 완료합니다. 서비스 이용약관과 개인정보 처리방침 두 개 모두 동의 필수입니다. pendingToken을 사용하여 인증하고, 약관 동의 후 정식 accessToken과 refreshToken을 발급합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pendingToken
 *               - agreements
 *             properties:
 *               pendingToken:
 *                 type: string
 *                 description: 소셜 로그인 콜백에서 발급받은 임시 토큰 (5분 유효)
 *                 example: "eyJhbGci..."
 *               agreements:
 *                 type: array
 *                 description: 필수 약관 2개 모두 동의 필수 (서비스 이용약관 + 개인정보 처리방침)
 *                 minItems: 2
 *                 example:
 *                   - termsId: "550e8400-e29b-41d4-a716-446655440001"
 *                     isAgreed: true
 *                   - termsId: "550e8400-e29b-41d4-a716-446655440002"
 *                     isAgreed: true
 *                 items:
 *                   type: object
 *                   required:
 *                     - termsId
 *                     - isAgreed
 *                   properties:
 *                     termsId:
 *                       type: string
 *                       format: uuid
 *                     isAgreed:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: 회원가입 완료 및 로그인 성공
 *         headers:
 *           Set-Cookie:
 *             description: refreshToken (httpOnly, 14일 유효)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "uuid-1234"
 *                         nickname:
 *                           type: string
 *                           example: "카카오닉네임"
 *                         email:
 *                           type: string
 *                           example: "user@kakao.com"
 *                         accountType:
 *                           type: string
 *                           enum: [SOCIAL]
 *                           example: "SOCIAL"
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: "eyJhbGci..."
 *                         tokenType:
 *                           type: string
 *                           example: "Bearer"
 *                         expiresIn:
 *                           type: integer
 *                           example: 3600
 *                 message:
 *                   type: string
 *                   example: "Social signup completed successfully"
 *       400:
 *         description: 유효성 검사 실패 또는 필수 약관 미동의
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation:
 *                 summary: pendingToken 누락
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "pendingToken이 필요합니다"
 *               termsRequired:
 *                 summary: 필수 약관 미동의
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "필수 약관에 동의해야 합니다"
 *       401:
 *         description: pendingToken 만료 또는 유효하지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH004"
 *                 message: "유효하지 않은 토큰입니다"
 */
router.post(
  '/social/complete',
  validate(completeSocialSignupDto),
  termsController.completeSocialSignup
);

// ==========================================
// SDK 소셜 로그인 (네이티브 앱용)
// ==========================================

/**
 * @swagger
 * /api/auth/kakao/sdk:
 *   post:
 *     summary: 카카오 SDK 로그인 (네이티브 앱)
 *     description: 카카오 SDK에서 발급받은 accessToken으로 서버 로그인을 처리합니다. 기존 회원이면 토큰 발급, 신규 회원이면 pendingToken 발급 후 약관 동의가 필요합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kakaoAccessToken
 *             properties:
 *               kakaoAccessToken:
 *                 type: string
 *                 description: 카카오 SDK에서 발급받은 access token
 *                 example: "kakao_access_token_..."
 *     responses:
 *       200:
 *         description: 로그인 성공 또는 약관 동의 필요
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - description: 기존 회원 - 토큰 발급
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             nickname:
 *                               type: string
 *                             accountType:
 *                               type: string
 *                               example: "SOCIAL"
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                             refreshToken:
 *                               type: string
 *                             tokenType:
 *                               type: string
 *                               example: "Bearer"
 *                             expiresIn:
 *                               type: integer
 *                               example: 3600
 *                 - description: 신규 회원 - 약관 동의 필요
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         pendingToken:
 *                           type: string
 *                         provider:
 *                           type: string
 *                           example: "KAKAO"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/kakao/sdk', sdkController.kakaoSdkLogin);

/**
 * @swagger
 * /api/auth/google/sdk:
 *   post:
 *     summary: 구글 SDK 로그인 (네이티브 앱)
 *     description: 구글 Sign-In SDK에서 발급받은 idToken으로 서버 로그인을 처리합니다. 기존 회원이면 토큰 발급, 신규 회원이면 pendingToken 발급 후 약관 동의가 필요합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: 구글 Sign-In SDK에서 발급받은 ID token
 *                 example: "eyJhbGci..."
 *     responses:
 *       200:
 *         description: 로그인 성공 또는 약관 동의 필요
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - description: 기존 회원 - 토큰 발급
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             nickname:
 *                               type: string
 *                             accountType:
 *                               type: string
 *                               example: "SOCIAL"
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                             refreshToken:
 *                               type: string
 *                             tokenType:
 *                               type: string
 *                               example: "Bearer"
 *                             expiresIn:
 *                               type: integer
 *                               example: 3600
 *                 - description: 신규 회원 - 약관 동의 필요
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         pendingToken:
 *                           type: string
 *                         provider:
 *                           type: string
 *                           example: "GOOGLE"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/google/sdk', sdkController.googleSdkLogin);

/**
 * @swagger
 * /api/auth/naver/sdk:
 *   post:
 *     summary: 네이버 SDK 로그인 (네이티브 앱)
 *     description: 네이버 SDK에서 발급받은 accessToken으로 서버 로그인을 처리합니다. 기존 회원이면 토큰 발급, 신규 회원이면 pendingToken 발급 후 약관 동의가 필요합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - naverAccessToken
 *             properties:
 *               naverAccessToken:
 *                 type: string
 *                 description: 네이버 SDK에서 발급받은 access token
 *                 example: "naver_access_token_..."
 *     responses:
 *       200:
 *         description: 로그인 성공 또는 약관 동의 필요
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - description: 기존 회원 - 토큰 발급
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             nickname:
 *                               type: string
 *                             accountType:
 *                               type: string
 *                               example: "SOCIAL"
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                             refreshToken:
 *                               type: string
 *                             tokenType:
 *                               type: string
 *                               example: "Bearer"
 *                             expiresIn:
 *                               type: integer
 *                               example: 3600
 *                 - description: 신규 회원 - 약관 동의 필요
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         pendingToken:
 *                           type: string
 *                         provider:
 *                           type: string
 *                           example: "NAVER"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/naver/sdk', sdkController.naverSdkLogin);

export default router;