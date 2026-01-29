import prisma from '../config/prisma.config.js';

// HIS-01: 사용자의 대화 이력 조회 (월별, 삭제되지 않은 항목)
export const findAllByUserId = async (userId, year, month) => {
  // 해당 월의 시작일과 종료일 계산
  const startDate = new Date(year, month - 1, 1); // month는 1~12
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // 해당 월의 마지막 날

  return await prisma.conversationHistory.findMany({
    where: {
      userId: userId,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
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

// HIS-03: 특정 이력 존재 여부 확인 (월별 필터링 추가)
export const findById = async (historyId, userId, year, month) => {
  // 해당 월의 시작일과 종료일 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return await prisma.conversationHistory.findFirst({
    where: {
      id: historyId,
      userId: userId,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
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

// HIS-04: 특정 월의 모든 이력 삭제 (Soft Delete, 조회 당월만)
export const deleteAllByUserId = async (userId, year, month) => {
  // 해당 월의 시작일과 종료일 계산
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return await prisma.conversationHistory.updateMany({
    where: {
      userId: userId,
      isDeleted: false,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });
};