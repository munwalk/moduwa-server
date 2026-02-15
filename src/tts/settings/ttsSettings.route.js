import express from "express";
import { authenticate } from "../../auth/middlewares/auth.middleware.js";
import { getTtsSettings, putTtsSettings, previewTts } from "./ttsSettings.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/ai/tts-settings:
 *   get:
 *     tags:
 *       - AI
 *     summary: TTS 음성 설정 조회
 *     description: |
 *       로그인 사용자의 저장된 `voiceKey` 설정을 조회합니다.
 *       - 최초/저장값 없음 → 기본값 `ADULT_FEMALE_DEFAULT`, `isDefault=true`
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
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
 *                     voiceKey:
 *                       type: string
 *                       example: "ADULT_FEMALE_DEFAULT"
 *                     isDefault:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "음성 설정 조회 성공"
 *       401:
 *         description: 인증 필요 (AUTH001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH001"
 *                 message: "Access token required"
 *                 detail: null
 *       500:
 *         description: 서버 내부 오류 (SERVER_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "SERVER_ERROR"
 *                 message: "서버 내부 오류가 발생했습니다"
 *                 detail: null
 *
 *   put:
 *     tags:
 *       - AI
 *     summary: TTS 음성 설정 변경(저장)
 *     description: |
 *       로그인 사용자의 기본 TTS 보이스 키(`voiceKey`)를 저장합니다.
 *       - 이후 `POST /api/ai/tts` 호출 시 요청에 `voiceKey`가 없으면 저장된 설정이 자동 적용됩니다.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voiceKey:
 *                 type: string
 *                 description: 서비스 내부 보이스 키
 *                 enum:
 *                   - KID_MALE
 *                   - KID_FEMALE
 *                   - ADULT_MALE_DEFAULT
 *                   - ADULT_FEMALE_DEFAULT
 *                   - ELDER_MALE
 *                   - ELDER_FEMALE
 *                 example: "ADULT_MALE_DEFAULT"
 *             required:
 *               - voiceKey
 *     responses:
 *       200:
 *         description: 성공
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
 *                     voiceKey:
 *                       type: string
 *                       example: "ADULT_MALE_DEFAULT"
 *                 message:
 *                   type: string
 *                   example: "음성 설정 변경 성공"
 *       400:
 *         description: 잘못된 요청 - voiceKey 누락/빈 문자열/허용되지 않은 값 (VALIDATION001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION001"
 *                 message: "입력값이 올바르지 않습니다"
 *                 detail:
 *                   field: "voiceKey"
 *       401:
 *         description: 인증 필요 (AUTH001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH001"
 *                 message: "Access token required"
 *                 detail: null
 *       500:
 *         description: 서버 내부 오류 (SERVER_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "SERVER_ERROR"
 *                 message: "서버 내부 오류가 발생했습니다"
 *                 detail: null
 */

/**
 * @swagger
 * /api/ai/tts-settings/preview:
 *   post:
 *     tags:
 *       - AI
 *     summary: TTS 미리듣기(고정 문구)
 *     description: |
 *       설정 화면의 “재생” 버튼 기능입니다.
 *       - 요청한 `voiceKey`로 아래 고정 문구를 음성으로 반환합니다.
 *       - 고정 문구: "안녕하세요. 저는 모두와AAC를 사용해서 말하고 있어요."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voiceKey:
 *                 type: string
 *                 enum:
 *                   - KID_MALE
 *                   - KID_FEMALE
 *                   - ADULT_MALE_DEFAULT
 *                   - ADULT_FEMALE_DEFAULT
 *                   - ELDER_MALE
 *                   - ELDER_FEMALE
 *                 example: "KID_FEMALE"
 *             required:
 *               - voiceKey
 *     responses:
 *       200:
 *         description: 성공 (MP3 바이너리 스트림)
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 잘못된 요청 - voiceKey 누락/빈 문자열/허용되지 않은 값 (VALIDATION001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION001"
 *                 message: "입력값이 올바르지 않습니다"
 *                 detail:
 *                   field: "voiceKey"
 *       401:
 *         description: 인증 필요 (AUTH001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "AUTH001"
 *                 message: "Access token required"
 *                 detail: null
 *       408:
 *         description: AI 응답 시간 초과 (AI001)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 code: "AI001"
 *                 message: "AI 응답 시간 초과"
 *                 detail: null
 *       500:
 *         description: AI 모델 처리 오류(AI002) 또는 서버 내부 오류(SERVER_ERROR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             examples:
 *               aiModelError:
 *                 summary: AI 모델 처리 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "AI002"
 *                     message: "AI 모델 처리 중 오류"
 *                     detail: null
 *               serverError:
 *                 summary: 서버 내부 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "SERVER_ERROR"
 *                     message: "서버 내부 오류가 발생했습니다"
 *                     detail: null
 */

router.get("/", authenticate, getTtsSettings);
router.put("/", authenticate, putTtsSettings);
router.post("/preview", authenticate, previewTts);

export default router;