import prisma from '../../config/prisma.config.js';
import * as feedbackRepository from '../repositories/feedback.repository.js';

/**
 * AI Edit Service
 * AI-02: 문장 편집 비즈니스 로직
 */

/**
 * 대화 문장 편집
 */
const editConversation = async (userId, conversationId, editedSentence, editDetails = null) => {
  // 대화 기록 조회
  const conversation = await prisma.conversationHistory.findUnique({
    where: {
      id: conversationId
    }
  });

  if (!conversation) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  // 권한 확인 (본인의 대화인지)
  if (conversation.userId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 이미 삭제된 대화인지 확인
  if (conversation.isDeleted) {
    throw new Error('CONVERSATION_DELETED');
  }

  const originalSentence = conversation.selectedSentence;

  // 문장이 변경되지 않았으면 에러
  if (originalSentence === editedSentence) {
    throw new Error('NO_CHANGE_DETECTED');
  }

  // 트랜잭션: ConversationHistory 업데이트 + AIFeedback 생성
  const result = await prisma.$transaction(async (tx) => {
    // 1. ConversationHistory의 selectedSentence 업데이트
    const updatedConversation = await tx.conversationHistory.update({
      where: {
        id: conversationId
      },
      data: {
        selectedSentence: editedSentence
      }
    });

    // 2. AIFeedback 생성
    const feedback = await tx.aIFeedback.create({
      data: {
        conversationId,
        userId,
        originalSentence: originalSentence || '',
        editedSentence,
        feedbackType: 'EDITED',
        editDetails: editDetails ? JSON.parse(JSON.stringify(editDetails)) : null
      }
    });

    return {
      conversation: updatedConversation,
      feedback
    };
  });

  return {
    conversationId: result.conversation.id,
    originalSentence,
    editedSentence,
    feedbackId: result.feedback.id,
    updatedAt: result.conversation.createdAt
  };
};

/**
 * 특정 대화의 편집 이력 조회
 */
const getEditHistory = async (userId, conversationId) => {
  // 대화 조회 및 권한 확인
  const conversation = await prisma.conversationHistory.findUnique({
    where: {
      id: conversationId
    }
  });

  if (!conversation) {
    throw new Error('CONVERSATION_NOT_FOUND');
  }

  if (conversation.userId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 편집 이력 조회
  const feedbacks = await feedbackRepository.findFeedbackByConversation(conversationId);

  return {
    conversationId,
    currentSentence: conversation.selectedSentence,
    editHistory: feedbacks
  };
};

export {
  editConversation,
  getEditHistory
};
