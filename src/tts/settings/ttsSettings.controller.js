import { UnauthorizedError } from "../../errors/app.error.js";
import { getTtsVoiceKey, updateTtsVoiceKey } from "./ttsSettings.service.js";
import { validateUpdateTtsSettingsBody, validatePreviewTtsBody } from "./ttsSettings.validator.js";
import { synthesizeTts } from "../tts.service.js";

const resolveUserId = (req) => {
    // settings.controller.js와 동일한 방식
    return req.user?.userId ?? req.userId ?? req.user?.id;
};

// GET /api/ai/tts-settings
export const getTtsSettings = async (req, res, next) => {
    try {
        const userId = resolveUserId(req);

        if (!userId) {
            throw new UnauthorizedError("인증 정보가 없습니다.");
        }

        const result = await getTtsVoiceKey({ userId });

        if (typeof res.success === "function") {
            return res.success(result, "음성 설정 조회 성공");
        }

        return res.status(200).json({
            success: true,
            data: result,
            message: "음성 설정 조회 성공",
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/ai/tts-settings
export const putTtsSettings = async (req, res, next) => {
    try {
        const userId = resolveUserId(req);

        if (!userId) {
            throw new UnauthorizedError("인증 정보가 없습니다.");
        }

        const { voiceKey } = validateUpdateTtsSettingsBody(req.body);

        const updated = await updateTtsVoiceKey({ userId, voiceKey });

        if (typeof res.success === "function") {
            return res.success(updated, "음성 설정 변경 성공");
        }

        return res.status(200).json({
            success: true,
            data: updated,
            message: "음성 설정 변경 성공",
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/ai/tts-settings/preview
export const previewTts = async (req, res, next) => {
    try {
        const userId = resolveUserId(req);

        if (!userId) {
            throw new UnauthorizedError("인증 정보가 없습니다.");
        }

        const { voiceKey } = validatePreviewTtsBody(req.body);

        const fixedText = "안녕하세요. 저는 모두와AAC를 사용해서 말하고 있어요.";

        // speed는 parseTtsRequest의 기본과 동일하게 1.0 사용
        const { contentType, audioBuffer } = await synthesizeTts({
            text: fixedText,
            voiceKey,
            speed: 1.0,
        });

        res.status(200);
        res.setHeader("Content-Type", contentType);
        return res.send(audioBuffer);
    } catch (err) {
        return next(err);
    }
};