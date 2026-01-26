import { countBySelectedSentence } from '../repositories/conversation.repository.js';
import { findFrequentPatterns } from '../repositories/learning.repository.js';

/**
 * 사용자 선택 문장 저장 (학습 데이터)
 * ConversationHistory를 집계하여 사용 빈도 계산
 */
const saveUserSelection = async (userId, selectedSentence) => {
  try {
    // ConversationHistory에서 동일 패턴 사용 횟수 조회
    const usageCount = await countBySelectedSentence(userId, selectedSentence);

    console.log(`✅ 학습 데이터 확인: "${selectedSentence}" 사용 횟수 ${usageCount + 1}회`);

    // 새로운 패턴인지 여부 (첫 사용이면 true)
    return {
      isNew: usageCount === 0,
      usageFrequency: usageCount + 1
    };
  } catch (error) {
    console.error('❌ 학습 데이터 확인 실패:', error);
    throw error;
  }
};

/**
 * 자주 선택된 패턴 조회 (상위 N개)
 * 캐싱 우선순위 결정에 사용
 */
const getFrequentSelections = async (userId, limit = 100) => {
  try {
    const frequentPatterns = await findFrequentPatterns(userId, limit);

    return frequentPatterns.map(p => ({
      words: JSON.parse(p.inputPattern),
      sentence: p.outputSentence,
      frequency: p.usageFrequency,
      confidence: p.feedbackScore
    }));
  } catch (error) {
    console.error('❌ 자주 사용된 패턴 조회 실패:', error);
    return [];
  }
};

export { saveUserSelection, getFrequentSelections };
