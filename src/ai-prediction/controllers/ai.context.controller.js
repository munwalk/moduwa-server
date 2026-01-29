import { getRecentConversations } from '../services/conversation.service.js';

/**
 * AI-01-3: 10분 이내 대화 기록 조회
 * GET /api/ai/context
 */
const contextController = async (req, res, next) => {
  try {
    console.log('🔵 AI Context 요청 받음');

    // userId는 인증 미들웨어에서 추출
    const userId = req.user.userId;

    // 10분 이내 대화 기록 조회
    const context = await getRecentConversations(userId);

    console.log(`✅ 맥락 조회 완료: ${context.previousMessages.length}개 메시지`);

    return res.status(200).success(
      {
        context: {
          currentTime: context.currentTime,
          previousMessages: context.previousMessages
        }
      },
      '맥락 조회 성공'
    );
  } catch (error) {
    console.error('[AI Context Error]', error);
    return next(error);
  }
};

export { contextController };
