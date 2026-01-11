import textToSpeech from '@google-cloud/text-to-speech';
import {
    BaseError,
    AiModelError,
} from "../errors/app.error.js";

// 클라이언트 인스턴스 생성 (환경변수 GOOGLE_APPLICATION_CREDENTIALS를 자동으로 읽음)
const client = new textToSpeech.TextToSpeechClient();

const VOICE_MAP = {
    // [남자 아이]: 여성 모델(A)을 베이스로 피치를 살짝 올림 (+3) -> 변성기 전 소년 목소리
    KID_MALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-B", // 중요: 여성 모델 사용
        ssmlGender: "FEMALE",    // API 요청엔 모델 성별을 따라야 함
        pitch: 2.0,
        speakingRate: 1.05
    },

    // [여자 아이]: 다른 여성 모델(B)을 사용하여 '엄마'와 목소리 톤을 분리함
    KID_FEMALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-A", // Neural2-B는 A보다 조금 더 부드러운 톤
        ssmlGender: "FEMALE",
        pitch: 2.0,
        speakingRate: 1.05
    },

    // [성인 남성]: 가장 안정적인 저음 남성 모델
    ADULT_MALE_DEFAULT: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-C",
        ssmlGender: "MALE",
        pitch: 0.0,
        speakingRate: 1.0
    },

    // [성인 여성]: 가장 표준적인 아나운서 톤 (아이 목소리 베이스인 A를 여기서도 씀)
    ADULT_FEMALE_DEFAULT: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-A",
        ssmlGender: "FEMALE",
        pitch: 0.0,
        speakingRate: 1.0
    },

    // [할아버지]: 남성 모델 톤을 낮추되, 너무 느리지 않게 설정 (답답함 방지)
    ELDER_MALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-C",
        ssmlGender: "MALE",
        pitch: -4.5,
        speakingRate: 0.9
    },

    // [할머니]: 여성 모델(B) 베이스로 낮고 차분하게
    ELDER_FEMALE: {
        languageCode: "ko-KR",
        name: "ko-KR-Neural2-B",
        ssmlGender: "FEMALE",
        pitch: -3.5,
        speakingRate: 0.9
    },
};


export async function synthesizeTts({ text, voiceKey, speed }) {
    try {
        const voiceConfig = VOICE_MAP[voiceKey] ?? VOICE_MAP.ADULT_FEMALE_DEFAULT;

        // 공식 라이브러리 요청 구성
        const request = {
            input: { text: text },
            voice: {
                languageCode: voiceConfig.languageCode,
                name: voiceConfig.name,
                ssmlGender: voiceConfig.ssmlGender,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speed,
                pitch: voiceConfig.pitch ?? 0.0,
            },
        };

        // API 호출 (axios 대신 client 사용)
        const [response] = await client.synthesizeSpeech(request);

        // response.audioContent는 이미 Buffer 형태입니다. (Base64 변환 불필요)
        return {
            contentType: "audio/mpeg",
            audioBuffer: response.audioContent,
        };

    } catch (err) {
        console.error("Google TTS Error:", err);
        // 공식 라이브러리 에러 핸들링
        if (err.code === 401 || err.code === 403) {
            throw new BaseError("인증 오류가 발생했습니다.", 500, "AUTH_ERROR");
        }
        throw new AiModelError(); // AI002
    }
}