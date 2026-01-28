import prisma from "../config/prisma.config.js";

/**
 * ✅ UserSettings가 없으면 생성해서 반환
 * - gridColumns 기본값: 7
 *
 * ⚠️ Prisma model명이 `UserSettings`라면 client는 `prisma.userSettings`가 됩니다.
 * (지금 routine에서 RoutineMessage 썼던 것처럼, model 이름 기준으로 camelCase)
 */
export const getOrCreateUserSettings = async ({ userId }) => {
  // 1) 먼저 찾고
  const existing = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  // 2) 없으면 생성
  return prisma.userSettings.create({
    data: {
      userId,
      gridColumns: 7,
    },
  });
};
