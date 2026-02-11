import prisma from "../config/prisma.config.js";
import { BaseError } from "../errors/app.error.js";

export const patchCategoryOrdersRepo = async ({ userId, orders }) => {
  return await prisma.$transaction(async (tx) => {
    const ids = orders.map((o) => o.categoryId);

    // 내 카테고리인지 검증
    const categories = await tx.userCategory.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    if (categories.length !== orders.length) {
      throw new BaseError(
        "잘못된 카테고리 ID가 포함되어 있습니다.",
        400,
        "ORDER002",
      );
    }

    // 기존 displayOrder 초기화 (임시값으로)
    for (const item of categories) {
      await tx.userCategory.update({
        where: { id: item.id },
        data: { displayOrder: -1 },
      });
    }

    // 새 displayOrder 반영
    for (const item of orders) {
      await tx.userCategory.update({
        where: { id: item.categoryId },
        data: { displayOrder: item.displayOrder },
      });
    }

    return {
      updatedCount: orders.length,
      categoryOrders: orders.map((o) => ({
        id: o.categoryId,
        displayOrder: o.displayOrder,
      })),
    };
  });
};
