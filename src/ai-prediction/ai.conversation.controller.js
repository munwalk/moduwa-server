import { saveConversation } from './conversation.service.js';

/**
 * AI-01: 전체 대화 흐름 저장
 *
 * POST /api/ai/conversation
 * AI 추천 → 사용자 선택 전체 과정을 저장
 */
const saveConversationController = async (req, res, next) => {
  try {
    // userId는 인증 미들웨어에서 추출 (현재는 임시로 'guest' 사용)
    const userId = req.user?.id || 'guest';

    const {
      words,
      suggestedSentences,
      selectedSentence,
      selectionIndex
    } = req.body;

    // 입력 검증
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).error({
        code: 'INVALID_INPUT',
        message: '낱말 배열이 필요합니다'
      });
    }

    if (!suggestedSentences || !Array.isArray(suggestedSentences)) {
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
