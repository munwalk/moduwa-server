import prisma from "../config/prisma.config.js";
import { BaseError } from "../errors/app.error.js";

const LOCKED_DEFAULTS = {
  최근사용: 0,
  즐겨찾기: 1,
  어미: 2,
};

export const patchCategoryOrdersRepo = async ({ userId, orders }) => {
  return await prisma.$transaction(async (tx) => {
    // 전체 카테고리 조회
    const allCategories = await tx.userCategory.findMany({
      where: { userId },
    });

    if (allCategories.length !== orders.length) {
      throw new BaseError(
        "카테고리 전체 배열을 보내야 합니다.",
        400,
        "ORDER_FULL_REQUIRED",
      );
    }

    // ID 검증
    const ids = orders.map((o) => o.categoryId);

    const idSet = new Set(ids);
    if (idSet.size !== ids.length) {
      throw new BaseError("중복 ID가 포함되어 있습니다.", 400, "ORDER_DUP_ID");
    }

    const dbIdSet = new Set(allCategories.map((c) => c.id));

    for (const id of ids) {
      if (!dbIdSet.has(id)) {
        throw new BaseError(
          "잘못된 카테고리 ID입니다.",
          400,
          "ORDER_INVALID_ID",
        );
      }
    }

    // displayOrder 중복 검사
    const orderValues = orders.map((o) => o.displayOrder);
    const orderSet = new Set(orderValues);

    if (orderSet.size !== orderValues.length) {
      throw new BaseError(
        "displayOrder 값이 중복될 수 없습니다.",
        400,
        "ORDER_DUP_VALUE",
      );
    }

    // 고정 카테고리 보호
    for (const category of allCategories) {
      if (LOCKED_DEFAULTS[category.categoryName] !== undefined) {
        const incoming = orders.find((o) => o.categoryId === category.id);

        if (incoming.displayOrder !== LOCKED_DEFAULTS[category.categoryName]) {
          throw new BaseError(
            "고정 카테고리의 순서는 변경할 수 없습니다.",
            400,
            "ORDER_LOCKED",
          );
        }
      }
    }

    // 한 번에 업데이트
    const updatePromises = orders.map((item) =>
      tx.userCategory.update({
        where: { id: item.categoryId },
        data: { displayOrder: item.displayOrder },
      }),
    );

    await Promise.all(updatePromises);

    return {
      updatedCount: orders.length,
      categoryOrders: orders.map((o) => ({
        id: o.categoryId,
        displayOrder: o.displayOrder,
      })),
    };
  });
};
