/**
 * NLP Microservice Client
 * 파이썬 NLP 서버와 통신
 */

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * 단어의 품사를 분석
 * @param {string} word - 분석할 단어
 * @returns {Promise<{word: string, pos: string, category: string}>}
 */
export async function analyzeWord(word) {
  try {
    console.log(`[NLP Client] Sending request to ${NLP_SERVICE_URL}/analyze/word with word: ${word}`);
    
    const response = await fetch(`${NLP_SERVICE_URL}/analyze/word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ word })
    });

    console.log(`[NLP Client] Response status: ${response.status}`);

    if (!response.ok) {
      console.error('NLP 서비스 호출 실패:', response.status);
      return { word, pos: 'Unknown', category: 'NONE' }; // 기본값
    }

    const result = await response.json();
    console.log(`[NLP Client] Result:`, result);
    return result;
  } catch (error) {
    console.error('[NLP Client] NLP 서비스 연결 실패:', error.message);
    console.error('[NLP Client] Error stack:', error.stack);
    // NLP 서비스 실패시 기본값 반환 (서비스 중단 방지)
    return { word, pos: 'Unknown', category: 'NONE' };
  }
}

/**
 * NLP 서비스 상태 확인
 * @returns {Promise<boolean>}
 */
export async function checkNlpServiceHealth() {
  try {
    const response = await fetch(`${NLP_SERVICE_URL}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export default {
  analyzeWord,
  checkNlpServiceHealth
};
