import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUserCategory = async ({
  userId,
  categoryName,
  displayOrder,
}) => {
  return prisma.userCategory.create({
    data: {
      userId,
      categoryName,
      displayOrder,
    },
  });
};

export const findUserCategoryById = async ({ userId, id }) => {
  return prisma.userCategory.findFirst({
    where: { id, userId },
  });
};

export const updateUserCategory = async ({
  id,
  categoryName,
  displayOrder,
}) => {
  return prisma.userCategory.update({
    where: { id },
    data: {
      ...(categoryName !== undefined ? { categoryName } : {}),
      ...(displayOrder !== undefined ? { displayOrder } : {}),
    },
  });
};

export const deleteUserCategory = async ({ id }) => {
  return prisma.userCategory.delete({
    where: { id },
  });
};
