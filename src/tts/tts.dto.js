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

    return { ok: true, data: { text, voiceKey, speed } };
}
