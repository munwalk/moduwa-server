import { BaseError } from "../errors/app.error.js";
import {
  createPm02Category,
  updatePm02Category,
  deletePm02Category,
} from "./pm.service.js";
import {
  toPm02CategoryResponse,
  toPm02CategoryDeleteResponse,
} from "./pm.dto.js";
import { validateCategoryName, validateIconFields } from "./pm.validator.js";

export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { categoryName, iconKey, iconUrl } = req.body;

    validateCategoryName(categoryName, { required: true });
    validateIconFields({ iconKey, iconUrl });

    const created = await createPm02Category({
      userId,
      categoryName,
      iconKey,
      iconUrl,
    });

    return res
      .status(201)
      .success(toPm02CategoryResponse(created), "카테고리 생성 성공");
  } catch (err) {
    return next(err);
  }
};

export const patchCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { id } = req.params;
    const { categoryName, iconKey, iconUrl } = req.body;

    validateCategoryName(categoryName, { required: false });
    validateIconFields({ iconKey, iconUrl });

    const updated = await updatePm02Category({
      userId,
      id,
      ...(categoryName !== undefined ? { categoryName } : {}),
      ...(iconKey !== undefined ? { iconKey } : {}),
      ...(iconUrl !== undefined ? { iconUrl } : {}),
    });

    return res
      .status(200)
      .success(toPm02CategoryResponse(updated), "카테고리 수정 성공");
  } catch (err) {
    return next(err);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { id } = req.params;
    await deletePm02Category({ userId, id });

    return res
      .status(200)
      .success(toPm02CategoryDeleteResponse(id), "카테고리 삭제 성공");
  } catch (err) {
    return next(err);
  }
};
