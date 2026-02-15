import {
    getOrCreateUserSettings,
    upsertUserVoiceKey,
} from "./ttsSettings.repository.js";

export const DEFAULT_VOICE_KEY = "ADULT_FEMALE_DEFAULT";

export const getTtsVoiceKey = async ({ userId }) => {
    const settings = await getOrCreateUserSettings({ userId });

    // DB에 값이 없거나 이상하면 기본값으로 보정
    const voiceKey = settings?.voiceKey ?? DEFAULT_VOICE_KEY;

    return {
        voiceKey,
        isDefault: voiceKey === DEFAULT_VOICE_KEY,
    };
};

export const updateTtsVoiceKey = async ({ userId, voiceKey }) => {
    const updated = await upsertUserVoiceKey({ userId, voiceKey });

    return {
        voiceKey: updated.voiceKey ?? voiceKey,
    };
};
