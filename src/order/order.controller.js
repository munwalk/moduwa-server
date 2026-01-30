// import { BaseError } from "../errors/app.error.js";
// import { validateCategoryOrders } from "./order.validator.js";
// import { patchCategoryOrdersService } from "./order.service.js";
// import { toCategoryOrderResponse } from "./order.dto.js";

// export const patchCategoryOrders = async (req, res, next) => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

//     const { orders } = req.body;
//     validateCategoryOrders(orders);

//     // MOCK
//     if (
//       process.env.NODE_ENV === "development" &&
//       process.env.MOCK_DB === "true"
//     ) {
//       return res.status(200).success(
//         toCategoryOrderResponse({
//           updatedCount: orders.length,
//           categoryOrders,
//         }),
//         "카테고리 순서 변경 성공 (mock)",
//       );
//     }

//     // 실구현
//     const result = await patchCategoryOrdersService({ userId, orders });

//     return res.status(200).success(
//       toCategoryOrderResponse({
//         updatedCount: result.updatedCount,
//         categoryOrders,
//       }),
//       "카테고리 순서 변경 성공",
//     );
//   } catch (e) {
//     next(e);
//   }
// };

import { BaseError } from "../errors/app.error.js";
import { toCategoryOrderResponse } from "./order.dto.js";
import { patchCategoryOrdersService } from "./order.service.js";

export const patchCategoryOrders = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { orders } = req.body;
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new BaseError("orders는 비어있을 수 없습니다", 400, "ORDER001");
    }

    const categoryOrders = orders.map((o) => ({
      id: o.categoryId,
      displayOrder: o.displayOrder,
    }));

    // MOCK
    if (
      process.env.NODE_ENV === "development" &&
      process.env.MOCK_DB === "true"
    ) {
      return res.status(200).success(
        toCategoryOrderResponse({
          updatedCount: orders.length,
          categoryOrders,
        }),
        "카테고리 순서 변경 성공 (mock)",
      );
    }

    // 실구현
    const result = await patchCategoryOrdersService({
      userId,
      orders,
    });

    return res.status(200).success(
      toCategoryOrderResponse({
        updatedCount: result.updatedCount,
        categoryOrders,
      }),
      "카테고리 순서 변경 성공",
    );
  } catch (e) {
    next(e);
  }
};
