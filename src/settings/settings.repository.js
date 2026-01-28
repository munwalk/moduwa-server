import prisma from "../config/prisma.config.js";

export const getOrCreateUserSettings = async ({ userId }) => {
  const existing = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  return prisma.userSettings.create({
    data: {
      userId,
      gridColumns: 7,
    },
  });
};

export const upsertUserGridColumns = async ({ userId, gridColumns }) => {
  return prisma.userSettings.upsert({
    where: { userId },
    update: { gridColumns },
    create: { userId, gridColumns },
  });
};
