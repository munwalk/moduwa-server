const VOICE_KEYS = new Set([
    "KID_MALE",
    "KID_FEMALE",
    "ADULT_MALE_DEFAULT",
    "ADULT_FEMALE_DEFAULT",
    "ELDER_MALE",
    "ELDER_FEMALE",
]);

export function parseTtsRequest(body = {}) {
    const text = typeof body.text === "string" ? body.text.trim() : "";

    // 요청에 voiceKey 키가 존재했는지(값이 빈 문자열이어도 “보냈다”로 간주)
    const voiceKeyProvided = Object.prototype.hasOwnProperty.call(body, "voiceKey");

    const voiceKey =
        typeof body.voiceKey === "string" && body.voiceKey.trim()
            ? body.voiceKey.trim()
            : "ADULT_FEMALE_DEFAULT";

    const speed =
        typeof body.speed === "number" && !Number.isNaN(body.speed)
            ? body.speed
            : 1.0;

    if (!text) {
        return {
            ok: false,
            error: {
                status: 400,
                code: "AI003",
                message: "요청 값이 올바르지 않습니다",
                detail: { field: "text" },
            },
        };
    }

    if (!VOICE_KEYS.has(voiceKey)) {
        return {
            ok: false,
            error: {
                status: 400,
                code: "AI003",
                message: "요청 값이 올바르지 않습니다",
                detail: { field: "voiceKey" },
            },
        };
    }

    if (speed <= 0) {
        return {
            ok: false,
            error: {
                status: 400,
                code: "AI003",
                message: "요청 값이 올바르지 않습니다",
                detail: { field: "speed" },
            },
        };
    }

    // data에 voiceKeyProvided 추가
    return { ok: true, data: { text, voiceKey, speed, voiceKeyProvided } };
}