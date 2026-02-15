import { ValidationError } from "../../errors/app.error.js";

/**
 * voiceKey 허용 목록(단일 소스)
 * - 이후 다른 파일에서도 동일 목록을 재사용할 수 있도록 export
 */
export const ALLOWED_VOICE_KEYS = Object.freeze([
    "KID_MALE",
    "KID_FEMALE",
    "ADULT_MALE_DEFAULT",
    "ADULT_FEMALE_DEFAULT",
    "ELDER_MALE",
    "ELDER_FEMALE",
]);

/**
 * PUT /api/ai/tts-settings 요청 바디 검증
 */
export const validateUpdateTtsSettingsBody = (body) => {
    const voiceKey = body?.voiceKey;

    if (voiceKey === undefined || voiceKey === null || voiceKey === "") {
        throw new ValidationError("입력값이 올바르지 않습니다", {
            field: "voiceKey",
        });
    }

    if (typeof voiceKey !== "string") {
        throw new ValidationError("입력값이 올바르지 않습니다", {
            field: "voiceKey",
        });
    }

    if (!ALLOWED_VOICE_KEYS.includes(voiceKey)) {
        throw new ValidationError("입력값이 올바르지 않습니다", {
            field: "voiceKey",
        });
    }

    return { voiceKey };
};

export const validatePreviewTtsBody = (body) => {
    const voiceKey = body?.voiceKey;

    if (voiceKey === undefined || voiceKey === null || voiceKey === "") {
        throw new ValidationError("입력값이 올바르지 않습니다", { field: "voiceKey" });
    }

    if (typeof voiceKey !== "string") {
        throw new ValidationError("입력값이 올바르지 않습니다", { field: "voiceKey" });
    }

    const trimmed = voiceKey.trim();
    if (!ALLOWED_VOICE_KEYS.includes(trimmed)) {
        throw new ValidationError("입력값이 올바르지 않습니다", { field: "voiceKey" });
    }

    return { voiceKey: trimmed };
};

