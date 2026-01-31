import * as editService from '../services/ai.edit.service.js';

/**
 * AI Edit Controller
 * AI-02: 문장 편집 관리
 */

/**
 * 대화 문장 편집
 * PATCH /api/ai/conversations/:conversationId
 */
export const editConversationController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { editedSentence, editDetails } = req.body;

    const result = await editService.editConversation(
      userId,
      conversationId,
      editedSentence,
      editDetails
    );

    return res.status(200).success(result, '문장이 성공적으로 편집되었습니다');
  } catch (error) {
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).error({
        code: 'CONVERSATION_NOT_FOUND',
        message: '대화를 찾을 수 없습니다'
      });
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).error({
        code: 'FORBIDDEN',
        message: '권한이 없습니다'
      });
    }
    if (error.message === 'CONVERSATION_DELETED') {
      return res.status(410).error({
        code: 'CONVERSATION_DELETED',
        message: '삭제된 대화는 편집할 수 없습니다'
      });
    }
    if (error.message === 'NO_CHANGE_DETECTED') {
      return res.status(400).error({
        code: 'NO_CHANGE_DETECTED',
        message: '변경 사항이 없습니다'
      });
    }
    next(error);
  }
};

/**
 * 편집 이력 조회
 * GET /api/ai/conversations/:conversationId/history
 */
export const getEditHistoryController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const result = await editService.getEditHistory(userId, conversationId);

    return res.status(200).success(result, '편집 이력 조회 성공');
  } catch (error) {
    if (error.message === 'CONVERSATION_NOT_FOUND') {
      return res.status(404).error({
        code: 'CONVERSATION_NOT_FOUND',
        message: '대화를 찾을 수 없습니다'
      });
    }
    if (error.message === 'FORBIDDEN') {
      return res.status(403).error({
        code: 'FORBIDDEN',
        message: '권한이 없습니다'
      });
    }
    next(error);
  }
};
