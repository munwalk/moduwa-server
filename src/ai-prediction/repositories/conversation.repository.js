import prisma from '../../config/prisma.config.js';

/**
 * ConversationHistory Repository
 * DB 접근 로직만 담당
 */

/**
 * 대화 기록 생성
 */
const createConversation = async (data) => {
  return await prisma.conversationHistory.create({
    data
  });
};

/**
 * 특정 사용자의 최근 대화 기록 조회
 */
const findRecentConversations = async (userId, fromTime) => {
  return await prisma.conversationHistory.findMany({
    where: {
      userId,
      createdAt: { gte: fromTime },
      isDeleted: false
    },
    orderBy: { createdAt: 'asc' },
    select: {
      selectedSentence: true,
      createdAt: true
    }
  });
};

/**
 * 특정 문장의 사용 횟수 조회
 */
const countBySelectedSentence = async (userId, selectedSentence) => {
  return await prisma.conversationHistory.count({
    where: {
      userId,
      selectedSentence,
      isDeleted: false
    }
  });
};

export {
  createConversation,
  findRecentConversations,
  countBySelectedSentence
};
