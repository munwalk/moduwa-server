import { BaseError } from "../errors/app.error.js";

export const validateCategoryOrders = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new BaseError("orders는 1개 이상 배열이어야 합니다", 400, "ORD001");
  }

  const seenCategoryIds = new Set();
  const seenOrders = new Set();

  for (const item of orders) {
    if (!item || typeof item !== "object") {
      throw new BaseError(
        "orders 항목 형식이 올바르지 않습니다",
        400,
        "ORD002",
      );
    }

    const { categoryId, displayOrder } = item;

    if (!categoryId || typeof categoryId !== "string") {
      throw new BaseError("categoryId는 필수입니다", 400, "ORD003");
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 1) {
      throw new BaseError(
        "displayOrder는 1 이상의 정수여야 합니다",
        400,
        "ORD004",
      );
    }

    if (seenCategoryIds.has(categoryId)) {
      throw new BaseError("categoryId가 중복되었습니다", 400, "ORD005");
    }
    if (seenOrders.has(displayOrder)) {
      throw new BaseError("displayOrder가 중복되었습니다", 400, "ORD006");
    }

    seenCategoryIds.add(categoryId);
    seenOrders.add(displayOrder);
  }
};
