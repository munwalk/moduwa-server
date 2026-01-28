import prisma from '../../config/prisma.config.js';

/**
 * AILearningData Repository
 * DB 접근 로직만 담당
 */

/**
 * 자주 사용된 패턴 조회 (상위 N개)
 */
const findFrequentPatterns = async (userId, limit) => {
  return await prisma.aILearningData.findMany({
    where: { userId },
    orderBy: { usageFrequency: 'desc' },
    take: limit,
    select: {
      inputPattern: true,
      outputSentence: true,
      usageFrequency: true,
      feedbackScore: true
    }
  });
};

export {
  findFrequentPatterns
};
