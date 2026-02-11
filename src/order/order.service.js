import { patchCategoryOrdersRepo } from "./order.repository.js";

export const patchCategoryOrdersService = async ({ userId, orders }) => {
  const result = await patchCategoryOrdersRepo({ userId, orders });

  return {
    updatedCount: result.updatedCount,
    categoryOrders: result.categoryOrders,
  };
};
