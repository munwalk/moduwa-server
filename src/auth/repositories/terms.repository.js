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

/**
 * 약관 조회 (ID)
 */
export const findTermsById = async (id) => {
  return await prisma.terms.findUnique({
    where: { id }
  });
};

/**
 * 약관 동의 일괄 생성
 */
export const createBulkAgreements = async (data) => {
  return await prisma.termsAgreement.createMany({
    data,
    skipDuplicates: true
  });
};

/**
 * 사용자 약관 동의 내역 조회
 */
export const findUserAgreements = async (userId) => {
  return await prisma.termsAgreement.findMany({
    where: { userId },
    include: {
      terms: true
    },
    orderBy: { agreedAt: 'desc' }
  });
};

/**
 * 약관 동의 업데이트
 */
export const updateAgreement = async (userId, termsId, data) => {
  return await prisma.termsAgreement.update({
    where: {
      userId_termsId: {
        userId,
        termsId
      }
    },
    data
  });
};

/**
 * 약관 동의 여부 확인
 */
export const checkUserAgreedToTerms = async (userId, termsId) => {
  const agreement = await prisma.termsAgreement.findUnique({
    where: {
      userId_termsId: {
        userId,
        termsId
      }
    }
  });

  return agreement?.isAgreed || false;
};