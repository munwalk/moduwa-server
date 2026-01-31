import { saveUserSelection } from '../services/ai.learning.service.js';
import { saveConversation } from '../services/conversation.service.js';

/**
 * AI-01-1: 사용자 선택 문장 저장
 * POST /api/ai/selections
 */
const selectionController = async (req, res, next) => {
  try {
    console.log('🔵 AI Selection 요청 받음:', req.body);

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, suggestedSentences, selectedSentence } = req.body;

    // userId는 인증 미들웨어에서 추출
    const userId = req.user.userId;

    // 1. 학습 데이터(UserSelection)만 기록 (대화 저장은 하지 않음)
    const learningResult = await saveUserSelection(userId, selectedSentence);

    console.log('✅ AI 추천 학습 완료 (대화 저장은 나중에 진행)');

    return res.status(200).success(
      {
        saved: true,
        usageCount: learningResult.usageFrequency,
        isNewPattern: learningResult.isNew
      },
      '학습 피드백 데이터 업데이트 완료'
    );
  } catch (error) {
    console.error('[AI Selection Error]', error);
    return next(error);
  }
};

export { selectionController };
