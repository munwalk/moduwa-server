import { Router } from "express";
import { tts } from "./tts.controller.js";
import { optionalAuthenticate } from "../auth/middlewares/optionalAuth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/ai/tts:
 *   post:
 *     tags:
 *       - AI
 *     summary: TTS 음성 생성
 *     description: |
 *       입력한 텍스트를 음성(MP3)으로 변환해 **binary(audio/mpeg)** 로 응답합니다.
 *
 *       ### voiceKey 적용 정책 (옵션2)
 *       - 요청에 `voiceKey`가 **명시되면** 해당 값이 **최우선**으로 적용됩니다.
 *       - 요청에 `voiceKey`가 **없고**, Authorization(Access Token)이 **유효하면**
 *         저장된 사용자 음성 설정(`tts-settings`)의 `voiceKey`가 **자동 적용**됩니다.
 *       - Authorization이 **없으면(비로그인)** 기본 `voiceKey`(`ADULT_FEMALE_DEFAULT`)로 재생합니다.
 *
 *       ### Notes (테스트/정책)
 *       - **CORS 정책**: 브라우저(Swagger UI/HTML 테스트)에서 호출 시, 서버의 CORS 허용 Origin이 아니면 요청이 차단되어 `Failed to fetch`가 발생할 수 있습니다.
 *         - 로컬 테스트 예: `http://localhost:5500`, `http://127.0.0.1:5500` (Live Server), `http://localhost:5173` (Vite)
 *       - **Swagger UI 제한**: 응답이 `audio/mpeg`(binary)이므로 Swagger UI에서 재생/미리보기가 환경에 따라 정상 동작하지 않을 수 있습니다.
 *         - 실제 재생 검증은 **curl로 파일 저장(out.mp3)** 또는 **HTML fetch(blob) 테스트**, **클라이언트(안드로이드) 구현**에서 확인을 권장합니다.
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: 읽을 문장 (필수)
 *                 example: "어제 라면을 먹고 잤더니 부었어요"
 *               voiceKey:
 *                 type: string
 *                 description: |
 *                   보이스 키 (선택)
 *                   - 명시하면 해당 값 우선 적용
 *                   - 생략하면 (로그인 시) 저장된 설정값 자동 적용, (비로그인 시) 기본값 적용
 *                 enum:
 *                   - KID_MALE
 *                   - KID_FEMALE
 *                   - ADULT_MALE_DEFAULT
 *                   - ADULT_FEMALE_DEFAULT
 *                   - ELDER_MALE
 *                   - ELDER_FEMALE
 *                 example: "ADULT_FEMALE_DEFAULT"
 *               speed:
 *                 type: number
 *                 description: |
 *                   속도 (선택, 기본값 1.0)
 *                   - ※ 서버 로직에서 지원 중(0 이하 불가). 문서 요구사항에 없다면 프론트는 생략해도 됩니다.
 *                 example: 1.0
 *             required:
 *               - text
 *           examples:
 *             default:
 *               summary: 기본 요청 예시
 *               value:
 *                 text: "어제 라면을 먹고 잤더니 부었어요"
 *                 voiceKey: "ADULT_FEMALE_DEFAULT"
 *
 *     responses:
 *       200:
 *         description: 성공 (MP3 바이너리 스트림)
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 잘못된 요청 (AI003) - text 누락/빈 문자열 또는 voiceKey/speed 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             examples:
 *               missingText:
 *                 summary: text 누락/빈 문자열
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "AI003"
 *                     message: "요청 값이 올바르지 않습니다"
 *                     detail:
 *                       field: "text"
 *               invalidVoiceKey:
 *                 summary: voiceKey가 enum에 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "AI003"
 *                     message: "요청 값이 올바르지 않습니다"
 *                     detail:
 *                       field: "voiceKey"
 *               invalidSpeed:
 *                 summary: speed가 0 이하
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "AI003"
 *                     message: "요청 값이 올바르지 않습니다"
 *                     detail:
 *                       field: "speed"
 *       401:
 *        description: 인증 실패 (AUTH001) - Authorization 헤더가 존재하지만 토큰이 유효하지 않은 경우
 *        content:
 *          application/json:
 *            schema:
 *              $ref: "#/components/schemas/ErrorResponse"
 *            example:
 *              success: false
 *              error:
 *                code: "AUTH001"
 *                message: "Access token required"
 *                detail: null
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

// POST /api/ai/tts
router.post("/", optionalAuthenticate, tts);

export default router;
