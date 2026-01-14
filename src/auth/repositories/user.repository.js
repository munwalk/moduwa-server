import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * User 생성
 */
export const createUser = async (data) => {
  return await prisma.user.create({
    data
  });
};

/**
 * User 조회 (ID)
 */
export const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      settings: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
};

/**
 * User 조회 (Email)
 */
export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

/**
 * User 업데이트
 */
export const updateUser = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data
  });
};

/**
 * User 삭제 (Soft Delete)
 */
export const deleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { updatedAt: new Date() }
  });
};

/**
 * 마지막 로그인 시간 업데이트
 */
export const updateLastLogin = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() }
  });
};

/**
 * User 생성 (트랜잭션 - 설정, 구독 포함)
 */
export const createUserWithDefaults = async (userData) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: userData
    });

    await tx.userSettings.create({
      data: {
        userId: user.id
      }
    });

    await tx.subscription.create({
      data: {
        userId: user.id,
        planType: 'FREE',
        status: 'ACTIVE',
        startDate: new Date()
      }
    });

    return user;
  });
};

/**
 * 게스트 → 소셜 계정 전환 (트랜잭션)
 */
export const convertGuestToSocial = async (userId, providerData, userData) => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: userData
    });

    await tx.userProvider.create({
      data: providerData
    });

    return user;
  });
};