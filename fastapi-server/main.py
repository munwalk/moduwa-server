"""
FastAPI 서버 - 모두와 AAC AI 문장 추천 + 품사 분석
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from openai import OpenAI
import openai
import os
import json
import hashlib
import logging
from dotenv import load_dotenv
import redis
from konlpy.tag import Okt
from enum import Enum

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenAI 클라이언트 초기화
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    max_retries=0  # 자동 재시도 금지
)

# KoNLPy 초기화
okt = Okt()

# Redis 클라이언트 초기화
redis_client = None
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=int(os.getenv("REDIS_DB", 0)),
        decode_responses=True,
        socket_connect_timeout=2
    )
    redis_client.ping()
    logger.info("✅ Redis 연결 성공")
except Exception as e:
    logger.warning(f"⚠️ Redis 연결 실패 (캐싱 비활성화): {e}")
    redis_client = None

app = FastAPI(
    title="모두와 AAC AI 서버",
    description="AI 문장 추천 API",
    version="1.0.0"
)

# CORS 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Enums & Models
# ============================================

class PartOfSpeech(str, Enum):
    NOUN = "NOUN"
    VERB = "VERB"
    ADJECTIVE = "ADJECTIVE"
    MODIFIER = "MODIFIER"
    ENDING = "ENDING"
    NONE = "NONE"

# ============================================
# Request/Response Models
# ============================================

class ContextModel(BaseModel):
    currentTime: Optional[str] = None
    previousMessages: Optional[List[str]] = Field(default_factory=list)

class PredictRequest(BaseModel):
    words: List[str] = Field(..., min_items=1, max_items=10)
    context: Optional[ContextModel] = None
    refresh: bool = Field(default=False, description="true일 경우 캐시 무시하고 새로운 문장 생성")
    tone: Optional[str] = Field(default=None, description="반말/존댓말 모드 (HONORIFIC: 존댓말, INFORMAL: 반말)")

class PredictResponse(BaseModel):
    predictions: List[str]
    fromCache: bool = Field(default=False, description="캐시에서 반환되었는지 여부")


class TransformStyleRequest(BaseModel):
    words: List[str] = Field(..., min_items=1, max_items=10)
    endingCards: Optional[List[str]] = Field(default=None, max_items=5, description="어미 선택 카드 배열 (최대 5개)")
    tone: Optional[str] = Field(default=None, description="반말/존댓말 모드 (HONORIFIC: 존댓말, INFORMAL: 반말)")
    refresh: bool = Field(default=False, description="true일 경우 캐시 무시하고 새로운 문장 생성")

class TransformStyleResponse(BaseModel):
    words: List[str]
    endingCards: List[str]
    sentences: List[str]
    fromCache: bool = Field(default=False, description="캐시에서 반환되었는지 여부")

# ============================================
# Redis 캐싱 헬퍼 함수
# ============================================

def generate_cache_key(words: List[str], context: Optional[ContextModel], endpoint: str = "predictions", tone: Optional[str] = None) -> str:
    """캐시 키 생성 (words + context + tone 기반)"""
    cache_data = {
        "words": sorted(words),  # 순서 무관하게 캐싱
        "context": {
            "previousMessages": context.previousMessages if context else []
        },
        "endpoint": endpoint
    }
    if tone:
        cache_data["tone"] = tone
    # separators=(',', ':')를 추가하여 불필요한 공백을 제거
    cache_str = json.dumps(cache_data, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return f"aac:{endpoint}:{hashlib.md5(cache_str.encode()).hexdigest()}"

def get_from_cache(cache_key: str) -> Optional[dict]:
    """Redis에서 캐시 조회"""
    if not redis_client:
        return None
    try:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"✅ 캐시 HIT: {cache_key}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"⚠️ 캐시 조회 실패: {e}")
    return None

def save_to_cache(cache_key: str, data: dict, ttl: int = 86400):
    """Redis에 캐시 저장 (기본 TTL: 24시간)"""
    if not redis_client:
        return
    try:
        redis_client.setex(cache_key, ttl, json.dumps(data, ensure_ascii=False))
        logger.info(f"✅ 캐시 저장: {cache_key}")
    except Exception as e:
        logger.warning(f"⚠️ 캐시 저장 실패: {e}")

# ============================================
# AI 문장 추천
# ============================================

@app.post("/api/ai/predictions", response_model=PredictResponse)
async def predict_sentences(request: PredictRequest):
    """
    낱말 배열로부터 자연스럽고 의미가 다른 문장 3개를 추천

    **핵심 기능:**
    - 모든 낱말을 반드시 포함하면서 의미/의도가 다른 3가지 문장 제공
    - 평서문/의문문/청유문 형식에 얽매이지 않고 자연스러운 다양성 제공
    - 이전 대화 맥락이 있다면 자연스럽게 반영

    **Parameters:**
    - **words**: 선택된 낱말 배열 (1~10개) - 모든 낱말이 각 문장에 포함됨
    - **context**: 대화 맥락 정보 (선택) - 이전 대화를 기반으로 더 적절한 문장 생성
    - **refresh**: 새로고침 여부 (기본값: false)
      - false: 캐시가 있으면 캐시 반환 (빠른 응답)
      - true: 캐시 무시하고 새로운 문장 생성 (다양한 표현)

    **Response:**
    - 3개 문장은 같은 단어로 표현 가능한 서로 다른 의미/상황/의도를 제공
    - 예: "저녁 먹다 배고프다" → 욕구 표현 / 원인 설명 / 제안 등 다양한 해석
    - fromCache: 캐시에서 반환되었는지 여부
    """
    try:
        words = request.words
        context = request.context or ContextModel()
        refresh = request.refresh
        tone = request.tone

        # 캐시 키 생성 (tone 포함)
        cache_key = generate_cache_key(words, context, "predictions", tone)

        # refresh가 false일 때만 캐시 확인
        if not refresh:
            cached_data = get_from_cache(cache_key)
            if cached_data:
                return PredictResponse(
                    predictions=[p["sentence"] for p in cached_data["predictions"]],
                    fromCache=True
                )

        # tone 지시문 생성
        if tone == "INFORMAL":
            tone_instruction = "\n\n반드시 반말로 문장을 작성하세요 (예: ~해, ~야, ~어, ~거야, ~자)"
        elif tone == "HONORIFIC":
            tone_instruction = "\n\n반드시 존댓말로 문장을 작성하세요 (예: ~요, ~습니다, ~세요, ~어요)"
        else:
            tone_instruction = ""

        # 단어 개수에 따라 System Prompt 분기
        if len(words) == 1:
            # 단어 1개: 간결 버전
            system_prompt = """AAC 사용자용 AI. 단어 1개로 자연스러운 문장 3개 생성. 가장 적절한 순서대로 배열.

명사: 부호로 의도 표현
용언: 자연스럽게 활용

금지: 다른 단어 추가"""
        else:
            # 단어 2개 이상: 간결 버전
            system_prompt = """AAC 사용자용 AI. 입력 단어 전부를 1개 문장에 담아, 서로 다른 의미/의도의 문장 3개 생성.

규칙:
1. 각 문장마다 입력 단어 전부 사용 (단어 분산 금지)
2. 조사/어미만 추가 — 명사·동사·형용사·부사 추가 절대 금지
3. 단어 나열 금지 (조사로 자연스럽게 연결)
4. 3개 문장은 서로 다른 의미/의도/상황"""

        # tone 지시문 system_prompt에 추가
        system_prompt += tone_instruction

        # User Prompt 생성 (단어 개수에 따라 분기)
        words_text = ", ".join([f'"{w}"' for w in words])

        if len(words) == 1:
            # 단어 1개: 간결 버전
            user_prompt = f"""단어: {words[0]}

가장 자연스러운 문장 3개를 순서대로 생성.

명사: 부호로 의도 (예: "물.", "물!", "물?")
용언: 활용형 (예: "가요", "가자", "갈까요?")

절대 금지: 다른 단어 추가

JSON: {{"predictions": ["문장1", "문장2", "문장3"]}}"""
        else:
            # 단어 2개 이상: 간결 버전
            user_prompt = f"단어 [{len(words)}개]: {words_text}\n"

            if context and context.previousMessages:
                prev_msgs = " / ".join(context.previousMessages[-3:])
                user_prompt += f"이전: {prev_msgs}\n"

            user_prompt += f"""
입력 단어 [{len(words)}개]: {words_text}

⛔ 각 문장에 위 단어 전부 포함 (단어를 문장 간에 분산 금지)
⛔ 입력에 없는 단어 추가 금지 (조사/어미만 허용)

나쁜 예 (단어 분산): 입력 ["머리", "아프다", "병원", "가다"] →
  1번: "머리가 아프다" ❌  2번: "병원에 가다" ❌  (단어가 나뉨!)
좋은 예 (전부 포함): →
  1번: "머리가 아파서 병원에 가요" ✅
  2번: "머리가 아프니 병원에 가야 해요" ✅
  3번: "머리 아프면 병원에 가세요" ✅

JSON: {{"predictions": ["표현1", "표현2", "표현3"]}}"""

        # OpenAI API 호출 (AI-01: 단어 개수에 따라 최적화)
        # 짧고 간결한 문장 생성 → max_tokens 최소화로 응답 속도 향상
        if len(words) == 1:
            temperature = 0.7
            max_tokens = 60
        elif len(words) <= 3:
            temperature = 0.7
            max_tokens = 80
        elif len(words) <= 6:
            temperature = 0.7
            max_tokens = 110
        elif len(words) <= 8:
            temperature = 0.7
            max_tokens = 130
        else:  # 9~10개
            temperature = 0.7
            max_tokens = 150

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=10.0,  # 타임아웃 10초
            response_format={"type": "json_object"}
        )

        # 응답 파싱
        raw_content = response.choices[0].message.content
        logger.info(f"OpenAI 원본 응답: {raw_content}")

        result = json.loads(raw_content)

        # 디버깅: OpenAI 응답 로깅
        logger.info(f"OpenAI 파싱된 응답: {result}")

        if "predictions" not in result or not isinstance(result["predictions"], list):
            raise ValueError("AI 응답 형식 오류")

        # 문장만 추출 (순위 점수는 Node.js에서 내부적으로 처리)
        predictions = []
        for sentence in result["predictions"][:3]:
            # 문자열 형식 또는 객체 형식 모두 처리
            if isinstance(sentence, str):
                predictions.append(sentence)
            else:
                predictions.append(sentence.get("sentence", ""))

        # 캐시에 저장
        cache_data = {
            "predictions": [{"sentence": p} for p in predictions]
        }
        # 스타일 변환은 비교적 결과가 고정적이므로 24시간(86400초) 캐싱
        save_to_cache(cache_key, cache_data, ttl=86400)

        return PredictResponse(predictions=predictions, fromCache=False)

    except Exception as openai_error:
        logger.error(f"OpenAI API 오류: {openai_error}")
        if "timeout" in str(openai_error).lower():
            raise HTTPException(status_code=504, detail="AI 응답 시간 초과 (10초)")
        if hasattr(openai_error, '__class__') and 'openai' in str(openai_error.__class__).lower():
            raise HTTPException(status_code=500, detail=f"OpenAI API 오류: {str(openai_error)}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(openai_error)}")
    except Exception as e:
        logger.error(f"서버 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# ============================================
# 어미 선택 카드 적용 문장 추천 (AI-05)
# ============================================

@app.post("/api/ai/styles", response_model=TransformStyleResponse)
async def transform_sentence_style(request: TransformStyleRequest):
    """
    AI-05: 낱말 카드 + 어미 선택 카드(들)을 조합하여 사용자 맞춤형 문장 3개를 생성

    **핵심 기능**:
    - 여러 어미 카드를 동시에 적용하여 **말투와 어투를 합성**
    - 기본 카드 외 커스텀 텍스트(예: "해주세용", "~하긔") 자유롭게 사용 가능
    - LLM이 모든 카드의 의미를 분석하여 자연스럽게 합성

    **Parameters:**
    - **words**: 낱말 카드 배열 (1~10개)
    - **endingCards**: 어미 선택 카드 배열 (1~5개)
      - 기본 5개: "하고 싶어요", "하기 싫어요", "질문", "해주세요", "합시다"
      - 커스텀 어투: "부드럽게", "단호하게", "정중하게" 등
      - 커스텀 말투: "해주세용", "~하긔", "~함" 등
      - 다중 적용 가능: ["질문", "하고 싶어요"] → 의문형 소망 표현
    - **refresh**: true일 경우 캐시 무시하고 새로운 문장 생성

    **예시**:
    - ["질문"] → 3개 모두 의문문
    - ["부드럽게"] → 3개 모두 부드러운 어조
    - ["질문", "부드럽게"] → 부드러운 의문문
    - ["해주세용"] → "~해주세용" 형태 반영
    """
    try:
        words = request.words
        endingCards = request.endingCards or []
        tone = request.tone
        refresh = request.refresh

        # 캐시 키 생성 (endingCards + tone 포함)
        endingCards_str = "+".join(sorted(endingCards))  # 순서 무관하게 정렬
        cache_key = generate_cache_key(words, None, f"styles:{endingCards_str}", tone)

        # refresh가 false일 때만 캐시 확인
        if not refresh:
            cached_data = get_from_cache(cache_key)
            if cached_data:
                return TransformStyleResponse(
                    words=cached_data["words"],
                    endingCards=cached_data["endingCards"],
                    sentences=cached_data["sentences"],
                    fromCache=True
                )

        # 다중 어미 카드 합성 지시 생성
        # 각 카드의 의미를 LLM이 자동으로 분석하여 합성
        endingCards_text = ", ".join([f'"{card}"' for card in endingCards])

        # 기본 카드 설명 (참고용)
        basic_cards_guide = {
            "하고 싶어요": "희망/욕구 표현",
            "하기 싫어요": "거부/싫음 표현",
            "질문": "의문문",
            "해주세요": "요청문",
            "합시다": "청유문"
        }

        # 어미 카드 합성 지시문 생성
        if len(endingCards) == 1:
            card = endingCards[0]
            if card in basic_cards_guide:
                ending_instruction = f"{basic_cards_guide[card]} 스타일로 문장 완성"
            else:
                ending_instruction = f'"{card}"의 의미/어투/말투를 분석하여 자연스럽게 반영'
        else:
            # 다중 카드: 모든 카드의 의미를 합성
            ending_instruction = f"다음 어미 카드들을 모두 합성하여 문장 완성: {endingCards_text}\n"
            ending_instruction += "→ 각 카드의 의미(어투, 말투, 의도)를 분석하여 자연스럽게 결합할 것\n"
            ending_instruction += "→ 예: ['질문', '부드럽게'] = 부드러운 의문문\n"
            ending_instruction += "→ 예: ['하고 싶어요', '해주세용'] = '~하고 싶어요' 의도 + '~세용' 말투"

        # tone 지시문 생성 (system_prompt 앞에 붙여 최우선 적용)
        if tone == "INFORMAL":
            tone_prefix = "🔥 [최우선 말투 규칙] 모든 문장을 반말로 작성하세요 (~해, ~야, ~어, ~거야). 아래 어미 카드 규칙과 함께 반드시 반말 어미를 사용합니다.\n\n"
        elif tone == "HONORIFIC":
            tone_prefix = "🔥 [최우선 말투 규칙] 모든 문장을 존댓말로 작성하세요 (~요, ~습니다, ~세요). 아래 어미 카드 규칙과 함께 반드시 존댓말 어미를 사용합니다.\n\n"
        else:
            tone_prefix = ""

        # "질문" 카드 여부 사전 감지
        has_question_card = "질문" in endingCards

        # System Prompt: 질문 카드 유무에 따른 문장 형식 명확화
        system_prompt = tone_prefix + """AAC 어투 합성 전문가 AI입니다. 낱말(재료)에 모든 어미 카드(제약)를 100% 동시에 반영한 문장 3개를 만드세요.

📋 어미 카드 해석 절대 원칙 📋

어미 카드는 3가지 유형으로 분류됩니다:

A. **일반 어투/스타일 카드** (예: 부드럽게, 정중하게, 단호하게, 친근하게)
   → 🚨 절대 최우선: 카드 단어 자체를 문장에 삽입하면 시스템 완전 실패!
   → 이 단어들은 **말투 지시어**일 뿐! 문장에 절대 포함 금지!
   → "부드럽게" = 종결 어미(~주세요, ~해요, ~줘요)로만 표현! 단어 삽입 절대 금지!
   ❌ "창문을 부드럽게 닫아주세요" / "부드럽게 창문을 닫아주세요" (단어 삽입!)
   ✅ "창문 좀 닫아주세요" / "창문 닫아주세요" (말투만 표현!)
   ❌ "노래를 정중하게 불러요" (단어 삽입!)
   ✅ "노래를 불러드립니다" / "노래를 부릅니다" (격식체 어미만!)

B. **의도 카드** (예: 하고 싶어요, 하기 싫어요, 질문, 해주세요, 합시다)
   → 특정 문법 형식과 의미를 강제합니다!
   - "질문" → 동사/형용사 어미를 의문형으로 변환 + 물음표(?) 종결
   - "하고 싶어요" → 욕구 표현 필수 (나의 의사)
   - "하기 싫어요" → 부정 표현 필수 (나의 거부)

C. **커스텀 말투 카드** (예: ~용, ~긔, ~하긔, ~했슨)
   → 용언 어간에 직접 결합! 특히 "~하긔", "~했슨"은 중복 글자 제거 필수!
   ✅ "배고프다" + "~하긔" → "배고프긔" (어간 "배고프" + "긔", "하" 제거!)
   ❌ "배고프다" + "~하긔" → "배고프하긔" (중복 "하" 제거 안 함!)

🔥 절대 금지 2-A: "질문" 카드 있으면 평서문 = 시스템 완전 실패!
⛔ "질문" 카드 있으면 3개 문장 모두 의문형 어미로 끝 + 물음표(?)!
⛔ 단순히 마침표를 ?로 교체 금지! 반드시 동사/형용사 어미 자체를 의문형으로 변경!
⛔ 평서형 어미 그대로 + ? 붙이는 것 = 무조건 완전 실패!
  → 금지 평서형 어미 목록: -습니다, -겠습니다, -ㅂ니다, -이에요, -예요, -이다, -한다, -였어요
❌ "기분이 좋습니다?" → ✅ "기분이 좋으신가요?" / "기분이 좋나요?"
❌ "노래를 부르겠습니다?" → ✅ "노래를 부르실래요?" / "노래를 부르겠습니까?" / "노래를 부를까요?"
❌ "마트에 가서 장을 봤습니다?" → ✅ "마트에 가서 장을 봤나요?"
❌ "밥을 먹겠습니다?" → ✅ "밥을 먹겠습니까?" / "밥을 먹을까요?"
✅ 올바른 의문형 어미: ~나요?, ~세요?, ~할까요?, ~하실래요?, ~하십니까?, ~인가요?, ~겠습니까?

🔥 절대 금지 2-B: "질문" 카드 없으면 의문형 = 시스템 완전 실패!
⛔ "질문" 카드 없으면 3개 문장 모두 절대 물음표(?) 금지!
⛔ 의문형 어미(~ㄹ까요?, ~세요?, ~해요?, ~나요?, ~을까?, ~니?) 절대 사용 금지!
❌ ["안", "하다"] + ["단호하게"] → "안 하세요?" / "안 할까요?" (의문형 금지!)
✅ ["안", "하다"] + ["단호하게"] → "안 해!" / "안 한다!" / "절대 안 해!"

🔥 절대 금지 3: "하기 싫어요" 카드 있으면 긍정문 = 시스템 완전 실패!
⛔ 부정 표현: "안", "못", "-지 않다", "-기 싫다" 중 하나 반드시 포함!
❌ ["약", "먹다"] + ["하기 싫어요"] → "약 먹어!" → ✅ "약 안 먹어!" / "약 먹기 싫어요!"

🔥 절대 금지 4: 일반 스타일 카드에 임의로 의도 추가 = 시스템 완전 실패!
⛔ "부드럽게", "정중하게" 등 일반 스타일 카드만 있으면 중립적 평서문만!
⛔ 욕구 표현(-고 싶다), 부정 표현(-기 싫다, 안~), 거부 표현 임의 추가 절대 금지!
❌ ["밥", "먹다"] + ["부드럽게"] → "밥 먹기 싫어" / "밥 안 먹을래" (임의 의도 추가!)
✅ ["밥", "먹다"] + ["부드럽게"] → "밥 먹어요" / "밥 드세요" / "밥 먹을게요"

🚨 절대 위반 금지 규칙 🚨

규칙 1: "하기 싫어요"/"하고 싶어요" 의미 강제 (1인칭 주체!)
- "하기 싫어요" → 나의 거부, 부정 표현 필수 (안/못/-지 않다/-기 싫다)!
- "하고 싶어요" → 나의 긍정 욕구, 욕구 표현 필수! 부정 표현(-지 않다/안/못) 절대 금지!
- "질문" + "하고 싶어요" → 나의 욕구를 묻는 의문문! (상대방에게 묻는 질문 아님!)
  ❌ "너 자고 싶어?" / "잠 자고 싶지 않아?" → ✅ "잠 자도 될까요?"

규칙 2: 형태소 융합 (커스텀 어미 처리)
- 커스텀 어미는 용언 어간에서 '-다'를 제거하고 직접 결합!
- 🚨 특히 "~하긔", "~했슨" 같은 카드는 중복 글자 제거 필수!
- ✅ "배고프다" + "~하긔" → "배고프긔" / ❌ "배고프하긔" (중복 "하"!)
- ✅ "예쁘다" + "~했슨" → "예뻤슨" / ✅ "하다" + "~용" → "해용"

규칙 3: 모든 낱말 카드 100% 포함 + 낱말 카드 외 명사/동사/형용사/부사 추가 절대 금지!
- ❌ ["선생님"] → "선생님, 수업을 진행해도 될까요?" → ✅ "선생님?" / "선생님이세요?"

규칙 4: 구조적 변주 + 중복 절대 금지!
- 3개 문장은 반드시 서로 달라야 함!
- ✅ ["배고프다"] + ["~하긔"] → "배고프긔" / "배고프긴 하긔" / "배고프기도 하긔"

🚨 전수 반영 원칙: 선택된 모든 어미 카드를 3개 문장 각각에 100% 반영하세요!"""

        # User Prompt 생성: 주어진 카드만 사용 강제
        words_text = ", ".join([f'"{w}"' for w in words])

        # 문장에 직접 삽입되면 안 되는 스타일 카드 감지 (한국어 방식부사: ~게, ~히 어미)
        # 커스텀 카드는 어떤 값이든 올 수 있으므로 고정 리스트 대신 패턴으로 감지
        forbidden_style_words = [card for card in endingCards if card.endswith("게") or card.endswith("히")]
        if forbidden_style_words:
            quoted_forbidden = ', '.join(f'"{c}"' for c in forbidden_style_words)
            forbidden_words_line = (
                f"⛔⛔⛔ 이번 요청 절대 금지어: {quoted_forbidden} ⛔⛔⛔\n"
                f"→ 위 단어가 문장 어디에도 나타나면 즉시 재생성! 말투/어미로만 표현!\n"
            )
        else:
            forbidden_words_line = ""

        question_status = (
            "⚡ 질문 카드 감지됨! → 동사/형용사 어미를 의문형으로 변환 + ? 종결 필수! 평서형+? 절대 금지!"
            if has_question_card else
            "⚡ 질문 카드 없음! → 의문형 어미(~나요?/~세요?/~할까요?) 및 물음표(?) 절대 금지!"
        )

        user_prompt = f"""낱말 카드: {words_text}
어미 카드 [{len(endingCards)}개]: {endingCards_text}

{forbidden_words_line}

{question_status}

🚨 절대 최우선 확인!
1. **"질문" 카드 확인 (시스템 생사 결정!)**: {endingCards_text}에 "질문"이 있습니까?
   → **있으면**: 3개 문장 모두 동사/형용사 어미를 의문형으로 변환 후 물음표(?)로 끝!
     ❌ 평서형 어미 그대로+? 절대 금지 목록:
        "좋습니다?" / "갑니다?" / "했어요?" / "부르겠습니다?" / "먹겠습니다?" / "합니다?"
     ✅ 어미 자체를 의문형으로 변환:
        -습니다 → -습니까? / -나요? / -을까요?
        -겠습니다 → -겠습니까? / -실래요? / -을까요?
        예: "부르겠습니다?" ❌ → "부르실래요?" / "부르겠습니까?" / "부를까요?" ✅
     의문형 어미: ~나요?, ~세요?, ~할까요?, ~하실래요?, ~인가요?, ~겠습니까?
   → **없으면**: 3개 문장 중 단 하나도 물음표(?) 금지! 의문형 어미(~ㄹ까요?, ~세요?, ~래요?, ~나요?) 절대 사용 금지!

2. **1인칭 주체 원칙**: "하고 싶어요", "하기 싫어요"는 나의 의사 표현!
   → ❌ "너 자고 싶어?" → ✅ "잠 자도 될까요?"

🎯 핵심 규칙

**각 문장마다 {len(words)}개 낱말 카드를 전부 사용!**
→ 1번 문장 = {words_text} 전부 사용
→ 2번 문장 = {words_text} 전부 사용
→ 3번 문장 = {words_text} 전부 사용

| 카드 유형 | 구현 방법 | ✅ 정답 | ❌ 실패 |
|:---|:---|:---|:---|
| **부드럽게** | 중립 평서문 어미만 (~주세요, ~해요) | 창문 좀 닫아주세요 | 창문을 부드럽게 닫아주세요 (단어 삽입!) |
| **단호하게** | 강한 종결 어미 (~해!, ~한다!) | 안 해! / 절대 안 해! | 안 하세요? (의문형 금지!) |
| **정중하게** | 격식체 평서문 (~습니다, ~드립니다) | 노래를 불러드립니다 | 노래를 정중하게 불러요 (단어 삽입!) |
| **질문** | 어미를 의문형으로 변환 + ? | 마트에 갈까요? / 가실래요? | 마트에 갑니다? (평서형+?) / 마트에 가자. |
| **하기 싫어요** | 부정 표현 필수 (안/못/-기 싫다) | 약 안 먹어! / 먹기 싫어요! | 약 먹어! (긍정문!) |
| **하고 싶어요** | 긍정 욕구 표현 필수 | 놀이터 가고 싶어요! | 놀이터 가! (욕구 없음!) |
| **~긔, ~용, ~하긔** | 어간에 직접 결합 + 중복 글자 제거 | 배고프긔 / 먹용 | 배고프하긔 (중복 "하"!) |

🚨 최종 체크리스트

0. 일반 스타일 카드("부드럽게" 등)만 있는데 욕구/부정/거부 표현 추가했는가?
   ❌ ["밥", "먹다"] + ["부드럽게"] → "밥 먹기 싫어" → ✅ "밥 먹어요"

1. **질문 카드**: {endingCards_text}에 "질문" 있으면 → 의문형 어미로 변환 후 ?! 평서형+? 절대 금지!
   {endingCards_text}에 "질문" 없으면 → 물음표(?) 및 의문형 어미 절대 금지!

2. "하기 싫어요" 있으면 → 3개 문장 모두 부정 표현(안/못/-기 싫다) 포함?

3. "하고 싶어요" 있으면 → 3개 문장 모두 긍정 욕구(-고 싶다) 포함? 부정 표현 금지!

4. **스타일 단어 삽입 금지**: "{endingCards_text}"의 단어가 문장에 포함되었는가?
   → 포함 시 즉시 삭제하고 말투로만 표현!

5. 커스텀 어미(~하긔, ~했슨 등) 중복 글자 제거했는가?

6. 각 문장이 {words_text} 전부 포함?

7. {words_text} 외 명사/동사/형용사/부사 추가했는가? → 추가 시 즉시 재생성!

JSON: {{"sentences": ["문장1", "문장2", "문장3"]}}"""

        # OpenAI API 호출 (AI-05)
        if len(words) == 1:
            max_tokens = 100
        elif len(words) <= 3:
            max_tokens = 120
        elif len(words) <= 6:
            max_tokens = 150
        elif len(words) <= 8:
            max_tokens = 170
        else:  # 9~10개
            max_tokens = 190

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,  # 창의성 극도 제한하여 지시 사항 엄격 준수
            presence_penalty=1.5,  # 문장 중복 강력 방지
            max_tokens=max_tokens,
            timeout=10.0,  # 타임아웃 10초
            response_format={"type": "json_object"}
        )

        # 응답 파싱
        result = json.loads(response.choices[0].message.content)

        if "sentences" not in result or not isinstance(result["sentences"], list):
            raise ValueError("AI 응답 형식 오류")

        # 문장만 추출 (confidence는 Node.js에서 내부적으로 처리)
        sentences = []
        for sentence in result["sentences"][:3]:
            # 문자열 형식 또는 객체 형식 모두 처리
            if isinstance(sentence, str):
                sentences.append(sentence)
            else:
                sentences.append(sentence.get("sentence", ""))

        # 캐시에 저장
        cache_data = {
            "words": words,
            "endingCards": endingCards,
            "sentences": sentences
        }
        # 스타일 변환은 비교적 결과가 고정적이므로 24시간(86400초) 캐싱
        save_to_cache(cache_key, cache_data, ttl=86400)

        return TransformStyleResponse(
            words=words,
            endingCards=endingCards,
            sentences=sentences,
            fromCache=False
        )

    except openai.APITimeoutError:
        raise HTTPException(status_code=504, detail="AI 응답 시간 초과")
    except openai.APIError as e:
        raise HTTPException(status_code=500, detail=f"AI 모델 처리 중 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 내부 오류가 발생했습니다")

# ============================================
# 품사 분석 (NLP)
# ============================================

def map_pos_to_category(pos_tag: str) -> PartOfSpeech:
    """KoNLPy 품사 태그를 카테고리로 매핑"""
    if pos_tag.startswith('N'):
        return PartOfSpeech.NOUN
    elif pos_tag.startswith('V'):
        return PartOfSpeech.VERB
    elif pos_tag.startswith('Adj'):
        return PartOfSpeech.ADJECTIVE
    elif pos_tag == 'Eomi':
        return PartOfSpeech.ENDING
    elif pos_tag in ['Adv', 'Determiner']:
        return PartOfSpeech.MODIFIER
    elif pos_tag == 'Josa':
        return PartOfSpeech.MODIFIER
    else:
        return PartOfSpeech.MODIFIER


class WordRequest(BaseModel):
    word: str


class WordCategoryResponse(BaseModel):
    word: str
    pos: str
    category: PartOfSpeech


@app.post("/analyze/word")
async def analyze_word(request: WordRequest):
    """
    단어의 품사를 분석하여 카테고리 반환
    문장(공백 포함)인 경우 NONE 반환
    """
    text = request.word.strip()
    
    # 문장 판단: 공백 포함 시 문장으로 간주
    if " " in text:
        return WordCategoryResponse(word=text, pos="Sentence", category=PartOfSpeech.NONE)
    
    pos_result = okt.pos(text)

    if pos_result:
        word, pos = pos_result[0]
        category = map_pos_to_category(pos)
        return WordCategoryResponse(word=word, pos=pos, category=category)
    return WordCategoryResponse(word=text, pos="Unknown", category=PartOfSpeech.NONE)


@app.post("/analyze/nouns")
async def extract_nouns(request: WordRequest):
    """명사 여부 판단"""
    pos_result = okt.pos(request.word)

    if pos_result:
        word, pos = pos_result[0]
        is_noun = pos.startswith('N')
        return {
            "word": word,
            "is_noun": is_noun,
            "category": "NOUN" if is_noun else "OTHER",
        }
    return {"word": request.word, "is_noun": False, "category": "OTHER"}


@app.post("/analyze/morphs")
async def extract_morphs(request: WordRequest):
    """형태소 분석 및 품사 카테고리 반환"""
    pos_result = okt.pos(request.word)

    if pos_result:
        word, pos = pos_result[0]
        category = map_pos_to_category(pos)
        return {
            "word": word,
            "pos": pos,
            "category": category.value,
        }
    return {"word": request.word, "pos": "Unknown", "category": "MODIFIER"}

# ============================================
# Health Check
# ============================================

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "service": "모두와 AAC AI 서버",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "모두와 AAC AI 서버",
        "docs": "/docs",
        "health": "/health"
    }
