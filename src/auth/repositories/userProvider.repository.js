import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * UserProvider 생성
 */
export const createUserProvider = async (data) => {
  return await prisma.userProvider.create({
    data: {
      ...data,
      providerUserId: String(data.providerUserId)
    }
  });
};

/**
 * UserProvider 조회 (Provider + ProviderUserId)
 */
export const findUserProvider = async (provider, providerUserId) => {
  return await prisma.userProvider.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId: String(providerUserId)
      }
    },
    include: {
      user: true
    }
  });
};

/**
 * UserProvider 조회 (UserId)
 */
export const findUserProvidersByUserId = async (userId) => {
  return await prisma.userProvider.findMany({
    where: { userId }
  });
};

/**
 * UserProvider 삭제
 */
export const deleteUserProvider = async (id) => {
  return await prisma.userProvider.delete({
    where: { id }
  });
};