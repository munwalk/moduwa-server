import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 활성화된 약관 조회
 */
export const findActiveTerms = async () => {
  return await prisma.terms.findMany({
    where: { isActive: true },
    orderBy: [
      { isRequired: 'desc' },
      { order: 'asc' }
    ]
  });
};

/**
 * 필수 약관 조회
 */
export const findRequiredTerms = async () => {
  return await prisma.terms.findMany({
    where: {
      isActive: true,
      isRequired: true
    }
  });
};