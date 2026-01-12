import textToSpeech from '@google-cloud/text-to-speech';
import {
    BaseError,
    AiModelError,
} from "../errors/app.error.js";

const client = new textToSpeech.TextToSpeechClient();

const VOICE_MAP = {
    // 남자 아이
    KID_MALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Wavenet-D",
        ssmlGender: "MALE",
        pitch: 6.0,
        speakingRate: 1.25
    },

    // 여자 아이
    KID_FEMALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Wavenet-A",
        ssmlGender: "FEMALE",
        pitch: 1.0,
        speakingRate: 1.2
    },

    // 성인 남성
    ADULT_MALE_DEFAULT: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-C",
        ssmlGender: "MALE",
        pitch: 0.0,
        speakingRate: 1.0
    },

    // 성인 여성
    ADULT_FEMALE_DEFAULT: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-A",
        ssmlGender: "FEMALE",
        pitch: 0.0,
        speakingRate: 1.05
    },

    // 할아버지
    ELDER_MALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-C",
        ssmlGender: "MALE",
        pitch: -6.5,
        speakingRate: 0.8
    },

    // 할머니
    ELDER_FEMALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Wavenet-B",
        ssmlGender: "FEMALE",
        pitch: -2.0,
        speakingRate: 0.9
    },
};

function transformTextToSsml(text, voiceKey) {
    // 1. 할아버지: "힘 없고, 느리고, 반응이 늦은" 느낌 구현
    if (voiceKey === 'ELDER_MALE') {
        // 전체를 <prosody volume="soft">로 감싸서 성량을 죽임
        const weakVoiceStart = `<prosody volume="x-soft">`; // x-soft 또는 soft 사용
        const weakVoiceEnd = `</prosody>`;

        // 짧은 문장 (5글자 이하) -> 반응 딜레이 + 말끝 흐리기
        if (text.length <= 5) {
            return `
                <speak>
                    ${weakVoiceStart}
                        <break time="500ms"/> ${text}... 
                    ${weakVoiceEnd}
                </speak>
            `;
        }

        // 긴 문장 -> 중간에 숨차서 쉬기
        if (text.includes(' ')) {
            const words = text.split(' ');
            const midIndex = Math.max(1, Math.floor(words.length / 2));

            // 중간에 쉬는 구간도 조금 더 길게(500ms)
            words[midIndex] = `<break time="500ms"/> ... ${words[midIndex]}`;

            return `
                <speak>
                    ${weakVoiceStart}
                        <break time="300ms"/> 
                        ${words.join(' ')}
                    ${weakVoiceEnd}
                </speak>
            `;
        }

        // 공백 없는 긴 단어
        return `
            <speak>
                ${weakVoiceStart}
                    <break time="400ms"/> ${text}...
                ${weakVoiceEnd}
            </speak>
        `;
    }

    // 2. 아이들
    if (voiceKey === 'KID_FEMALE' || voiceKey === 'KID_MALE') {
        return `
            <speak>
                <prosody rate="fast" pitch="+1st">
                    ${text}
                </prosody>
            </speak>
        `;
    }

    // 3. 할머니
    if (voiceKey === 'ELDER_FEMALE') {
        return `
            <speak>
                <break time="200ms"/>
                ${text}
            </speak>
        `;
    }

    // 4. 성인
    return `<speak>${text}</speak>`;
}

export async function synthesizeTts({ text, voiceKey, speed }) {
    try {
        const voiceConfig = VOICE_MAP[voiceKey] ?? VOICE_MAP.ADULT_FEMALE_DEFAULT;

        const ssmlText = transformTextToSsml(text, voiceKey);

        // 할아버지일 때만 속도 강제 고정
        const finalSpeed = (voiceKey === 'ELDER_MALE')
            ? voiceConfig.speakingRate
            : (speed || voiceConfig.speakingRate);

        // 할아버지일 때 전화기 필터 적용
        const effectsProfileId = (voiceKey === 'ELDER_MALE')
            ? ['telephony-class-application']
            : [];

        const request = {
            input: { ssml: ssmlText },
            voice: {
                languageCode: voiceConfig.languageCode,
                name: voiceConfig.name,
                ssmlGender: voiceConfig.ssmlGender,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: finalSpeed,
                pitch: voiceConfig.pitch ?? 0.0,
                effectsProfileId: effectsProfileId,
            },
        };

        const [response] = await client.synthesizeSpeech(request);

        return {
            contentType: "audio/mpeg",
            audioBuffer: response.audioContent,
        };
    } catch (err) {
        console.error("Google TTS Error:", err);
        if (err.code === 401 || err.code === 403) {
            throw new BaseError("인증 오류가 발생했습니다.", 500, "AUTH_ERROR");
        }
        throw new AiModelError();
    }
}