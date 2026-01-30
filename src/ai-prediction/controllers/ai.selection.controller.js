import { saveUserSelection } from '../services/ai.learning.service.js';
import { saveConversation } from '../services/conversation.service.js';

/**
 * AI-01-1: 사용자 선택 문장 저장
 * POST /api/ai/selection
 */
const selectionController = async (req, res, next) => {
  try {
    console.log('🔵 AI Selection 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, recommendedSentences, selectedSentence } = req.body;

    // userId는 인증 미들웨어에서 추출
    const userId = req.user.userId;

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
    return next(error);
  }
};

export { selectionController };
