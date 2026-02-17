import { parseTtsRequest } from "./tts.dto.js";
import { synthesizeTts } from "./tts.service.js";
import { BaseError } from "../errors/app.error.js";
import { getTtsVoiceKey } from "./settings/ttsSettings.service.js";

const resolveUserId = (req) => {
    return req.user?.userId ?? req.userId ?? req.user?.id;
};

export async function tts(req, res, next) {
    try {
        const parsed = parseTtsRequest(req.body);

        if (!parsed.ok) {
            const e = new BaseError(
                parsed.error.message,
                parsed.error.status,
                parsed.error.code,
            );
            e.detail = parsed.error.detail ?? null;
            throw e;
        }

        const userId = resolveUserId(req);

        let { text, voiceKey, speed, voiceKeyProvided } = parsed.data;

        /**
         * 옵션2 정책
         * - 요청에 voiceKey가 있으면: 요청값 우선
         * - 요청에 voiceKey가 없고 + 로그인(userId 존재)면: DB 설정값으로 주입
         * - 로그인 정보가 없으면: 기본값(ADULT_FEMALE_DEFAULT) 유지
         */
        if (!voiceKeyProvided && userId) {
            const saved = await getTtsVoiceKey({ userId });
            if (saved?.voiceKey) {
                voiceKey = saved.voiceKey;
            }
        }

        const { contentType, audioBuffer } = await synthesizeTts({
            text,
            voiceKey,
            speed,
        });

        res.status(200);
        res.setHeader("Content-Type", contentType);
        return res.send(audioBuffer);
    } catch (err) {
        return next(err);
    }
}
