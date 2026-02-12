import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 기본 카테고리

export const listDefaultCategories = async () => {
  return prisma.category.findMany({
    where: { isDefault: true },
    orderBy: { displayOrder: "asc" },
  });
};

export const countDefaultWordsInCategory = async ({ categoryId }) => {
  return prisma.word.count({
    where: { categoryId },
  });
};

// 사용자 카테고리

export const getNextDisplayOrder = async ({ userId }) => {
  const max = await prisma.userCategory.aggregate({
    where: { userId },
    _max: { displayOrder: true },
  });
  return (max._max.displayOrder ?? -1) + 1;
};

export const countDuplicateCategoryName = async ({
  userId,
  categoryName,
  excludeId,
}) => {
  return prisma.userCategory.count({
    where: {
      userId,
      categoryName,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
};

export const createUserCategory = async ({
  userId,
  categoryName,
  iconKey,
  iconUrl,
}) => {
  const maxOrder = await prisma.userCategory.aggregate({
    where: { userId },
    _max: { displayOrder: true },
  });

  const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

  return prisma.userCategory.create({
    data: {
      userId,
      categoryName,
      iconKey,
      iconUrl,
      displayOrder: nextOrder,
      isDefault: false,
    },
  });
};

export const listUserCategories = async ({ userId }) => {
  return prisma.userCategory.findMany({
    where: { userId },
    orderBy: { displayOrder: "asc" },
  });
};

export const findUserCategoryById = async ({ userId, id }) => {
  return prisma.userCategory.findFirst({
    where: { id, userId },
  });
};

export const updateUserCategory = async ({ userId, id, data }) => {
  return prisma.userCategory.update({
    where: { id },
    data,
  });
};

export const countUserWordsInCategory = async ({ userId, userCategoryId }) => {
  return prisma.userWord.count({
    where: {
      userId,
      userCategoryId,
      isDeleted: false,
    },
  });
};

export const deleteCategoryAndWords = async ({ userId, userCategoryId }) => {
  return prisma.$transaction(async (tx) => {
    const deletedWordCount = await tx.userWord.count({
      where: {
        userId,
        userCategoryId,
        isDeleted: false,
      },
    });

    // 소프트 삭제
    await tx.userWord.updateMany({
      where: { userId, userCategoryId, isDeleted: false },
      data: { isDeleted: true },
    });

    // 카테고리 삭제
    await tx.userCategory.delete({
      where: { id: userCategoryId },
    });

    return deletedWordCount;
  });
};
