import prisma from '../../config/prisma.config.js';

/**
 * AIFeedback Repository
 * AI-02: 문장 편집 피드백 관리
 */

/**
 * 피드백 생성 (문장 편집)
 */
const createFeedback = async (data) => {
  return await prisma.aIFeedback.create({
    data
  });
};

/**
 * 특정 대화의 피드백 조회
 */
const findFeedbackByConversation = async (conversationId) => {
  return await prisma.aIFeedback.findMany({
    where: {
      conversationId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * 사용자의 피드백 목록 조회
 */
const findFeedbacksByUser = async (userId, options = {}) => {
  const { limit, offset } = options;

  return await prisma.aIFeedback.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });
};

/**
 * 특정 피드백 조회
 */
const findFeedbackById = async (feedbackId) => {
  return await prisma.aIFeedback.findUnique({
    where: {
      id: feedbackId
    }
  });
};

export {
  createFeedback,
  findFeedbackByConversation,
  findFeedbacksByUser,
  findFeedbackById
};
