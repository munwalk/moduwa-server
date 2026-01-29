import { patchCategoryOrdersRepo } from "./order.repository.js";

export const patchCategoryOrdersService = async ({ userId, orders }) => {
  const updatedCount = await patchCategoryOrdersRepo({ userId, orders });
  return { updatedCount };
};
