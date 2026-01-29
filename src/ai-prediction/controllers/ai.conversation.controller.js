import { saveConversation } from '../services/conversation.service.js';

/**
 * AI-01: 전체 대화 흐름 저장
 *
 * POST /api/ai/conversation
 * AI 추천 → 사용자 선택 전체 과정을 저장
 */
const saveConversationController = async (req, res, next) => {
  try {
    // userId는 인증 미들웨어에서 추출
    const userId = req.user.userId;

    // 검증된 데이터 추출 (미들웨어에서 이미 검증 완료)
    const { words, suggestedSentences, selectedSentence, selectionIndex } = req.body;

    // 대화 흐름 저장
    const conversation = await saveConversation(
      userId,
      words,
      suggestedSentences,
      selectedSentence,
      selectionIndex
    );

    return res.status(201).success(
      {
        conversationId: conversation.id,
        saved: true,
        isOutputted: conversation.isOutputted
      },
      '대화 기록 저장 성공'
    );
  } catch (error) {
    return next(error);
  }
};

export { saveConversationController };
