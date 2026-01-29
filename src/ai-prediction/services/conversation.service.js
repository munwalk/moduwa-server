import { generateCacheKey, saveToCache } from '../../utils/cache.util.js';
import {
  createConversation,
  findRecentConversations
} from '../repositories/conversation.repository.js';

/**
 * 현재 시간을 한국 형식으로 생성 (요일 포함)
 * 예: "2026년 1월 6일 (월) 14:30"
 */
const getCurrentTimeKorean = () => {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[now.getDay()];

  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${date}일 (${dayOfWeek}) ${hours}:${minutes}`;
};

/**
 * 전체 대화 흐름 저장 + Redis 캐시 업데이트
 * AI 추천 → 사용자 선택 과정 기록
 *
 * MySQL 스키마 사용:
 * - inputWords (not inputCards)
 * - suggestedSentences (not recommendedSentences)
 * - createdAt (not contextTime)
 *
 * Redis 캐싱:
 * - 사용자가 선택한 추천 결과를 캐시에 저장
 * - 다음번 동일한 낱말 조합 요청 시 빠른 응답
 */
const saveConversation = async (
  userId,
  words,
  suggestedSentences,
  selectedSentence,
  selectionIndex = null
) => {
  try {
    // 1. DB에 대화 저장
    const conversation = await createConversation({
      userId,
      inputWords: words.map((word, index) => ({
        wordId: null,
        word,
        order: index + 1
      })),
      inputType: 'WORD_ONLY', // 낱말 카드만 사용
      suggestedSentences,
      selectedSentence,
      selectionIndex,
      isOutputted: false, // TTS 재생 전에는 false
      isDeleted: false
    });

    console.log('✅ 대화 기록 저장 완료');

    // 2. Redis 캐시 업데이트
    try {
      // 최근 10분 내 대화 맥락 조회 (캐시 키 생성용)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentConversations = await findRecentConversations(userId, tenMinutesAgo);

      // 맥락 데이터 구성
      const context = {
        previousMessages: recentConversations
          .filter(c => c.selectedSentence)
          .map(c => c.selectedSentence)
      };

      // 캐시 키 생성 (FastAPI와 동일한 로직)
      const cacheKey = generateCacheKey(words, context, 'predict');

      // 캐시에 저장할 데이터 (FastAPI 응답 형식과 동일)
      const cacheData = {
        predictions: suggestedSentences.map((sentence, idx) => ({
          sentence,
          confidence: idx === selectionIndex ? 0.95 : 0.85 - (idx * 0.05) // 선택된 문장에 높은 신뢰도
        }))
      };

      // Redis에 캐시 저장 (24시간 TTL)
      await saveToCache(cacheKey, cacheData, 86400);
      console.log('✅ Redis 캐시 업데이트 완료');
    } catch (cacheError) {
      // 캐시 실패는 심각한 오류가 아니므로 로그만 기록
      console.warn('⚠️ Redis 캐시 업데이트 실패 (대화는 정상 저장됨):', cacheError.message);
    }

    return conversation;
  } catch (error) {
    console.error('❌ 대화 기록 저장 실패:', error);
    throw error;
  }
};

/**
 * 10분 이내 대화 기록 조회
 * AI 맥락 생성에 사용
 *
 * MySQL 스키마 사용: createdAt (not contextTime)
 */
const getRecentConversations = async (userId) => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentConversations = await findRecentConversations(userId, tenMinutesAgo);

    // null이 아닌 문장만 반환
    const previousMessages = recentConversations
      .filter(c => c.selectedSentence)
      .map(c => c.selectedSentence);

    return {
      currentTime: getCurrentTimeKorean(),
      previousMessages
    };
  } catch (error) {
    console.error('❌ 최근 대화 조회 실패:', error);
    return {
      currentTime: getCurrentTimeKorean(),
      previousMessages: []
    };
  }
};

export { saveConversation, getRecentConversations, getCurrentTimeKorean };
