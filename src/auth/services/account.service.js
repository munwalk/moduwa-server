import { PrismaClient } from '@prisma/client';
import * as userRepository from '../repositories/user.repository.js';
import * as userProviderRepository from '../repositories/userProvider.repository.js';
import { deleteRefreshToken } from './token.service.js';

const prisma = new PrismaClient();

/**
 * 회원탈퇴 (Soft Delete)
 */
export const deleteUserAccount = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // 트랜잭션으로 처리
  await prisma.$transaction(async (tx) => {
    // 1. UserProvider 삭제 (소셜 계정 연동 해제)
    if (user.accountType === 'SOCIAL') {
      await userProviderRepository.deleteByUserId(userId, tx);
    }

    // 2. User Soft Delete (deletedAt 업데이트)
    await tx.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: null, // 개인정보 삭제
        nickname: `탈퇴회원_${userId.slice(0, 8)}`
      }
    });

    // 3. UserSettings 비활성화
    await tx.userSettings.updateMany({
      where: { userId },
      data: { updatedAt: new Date() }
    });

    // 4. Subscription 비활성화
    await tx.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: {
        status: 'CANCELLED',
        endDate: new Date()
      }
    });
  });

  // 5. Refresh Token 삭제 (Redis)
  await deleteRefreshToken(userId);

  return true;
};