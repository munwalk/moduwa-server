import prisma from "../config/prisma.config.js";

export const patchCategoryOrdersRepo = async ({ userId, orders }) => {
  const updates = orders.map(({ categoryId, displayOrder }) =>
    prisma.userCategory.updateMany({
      where: { id: categoryId, userId },
      data: { displayOrder },
    }),
  );

  const results = await prisma.$transaction(updates);

  const updatedCount = results.reduce((sum, r) => sum + (r?.count ?? 0), 0);
  return updatedCount;
};
