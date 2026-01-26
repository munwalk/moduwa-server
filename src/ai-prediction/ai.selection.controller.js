import { saveUserSelection } from './ai.learning.service.js';
import { saveConversation } from './conversation.service.js';

/**
 * AI-01-1: 사용자 선택 문장 저장
 * POST /api/ai/selection
 */
const selectionController = async (req, res) => {
  try {
    console.log('🔵 AI Selection 요청 받음:', req.body);

    const {
      words,
      recommendedSentences,
      selectedSentence
    } = req.body;

    // 필수 값 검증 - 개별적으로 검사
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '낱말 배열이 필요합니다'
      });
    }

    if (!recommendedSentences || !Array.isArray(recommendedSentences)) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '추천 문장 배열이 필요합니다'
      });
    }

    if (!selectedSentence || typeof selectedSentence !== 'string') {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '선택한 문장이 필요합니다'
      });
    }

    // userId는 인증 미들웨어에서 추출 (현재는 임시로 'guest' 사용)
    const userId = req.user?.userId || 'guest';

    // 1. 학습 데이터 확인 (ConversationHistory 집계)
    const learningResult = await saveUserSelection(
      userId,
      selectedSentence
    );

    // 2. 대화 기록 저장
    await saveConversation(
      userId,
      words,
      recommendedSentences,
      selectedSentence
    );

    console.log('✅ 선택 기록 저장 완료:', learningResult);

    return res.status(200).success(
      {
        saved: true,
        usageCount: learningResult.usageFrequency,
        isNewPattern: learningResult.isNew
      },
      '선택 기록이 저장되었습니다'
    );
  } catch (error) {
    console.error('[AI Selection Error]', error);
    return res.status(500).error({
      code: 'SELECTION_SAVE_FAILED',
      message: '선택 기록 저장 중 오류가 발생했습니다',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { selectionController };
