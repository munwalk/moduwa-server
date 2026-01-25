import prisma from '../config/prisma.config.js';

// HIS-01: 사용자의 모든 대화 이력 조회 (삭제되지 않은 항목)
export const findAllByUserId = async (userId) => {
  return await prisma.conversationHistory.findMany({
    where: {
      userId: userId,
      isDeleted: false 
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      inputWords: true,
      selectedSentence: true,
      createdAt: true
    }
  });
};

// HIS-03: 특정 이력 존재 여부 확인
export const findById = async (historyId, userId) => {
  return await prisma.conversationHistory.findFirst({
    where: {
      id: historyId,
      userId: userId,
      isDeleted: false
    }
  });
};

// HIS-03: 특정 이력 삭제 (Soft Delete)
export const deleteById = async (historyId, userId) => {
  return await prisma.conversationHistory.update({
    where: { id: historyId },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};

// HIS-04: 모든 이력 삭제 (Soft Delete)
export const deleteAllByUserId = async (userId) => {
  return await prisma.conversationHistory.updateMany({
    where: {
      userId: userId,
      isDeleted: false
    },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};