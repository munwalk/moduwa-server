import { BaseError } from "../errors/app.error.js";
import {
  toCategoryResponse,
  toCategoryDeleteResponse,
} from "./category.dto.js";
import { validateName, validateIcon } from "./category.validator.js";
import {
  createCategoryService,
  patchCategoryService,
  removeCategoryService,
} from "./category.service.js";

export const createCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { name, iconKey, iconUrl } = req.body;

    validateName(name, { required: true });
    validateIcon({ iconKey, iconUrl }, { required: true });

    // Mock 테스트용(생성)
    // if (
    //   process.env.NODE_ENV === "development" &&
    //   process.env.MOCK_DB === "true"
    // ) {
    //   const created = {
    //     id: "mock-category-id",
    //     userId,
    //     categoryName: name,
    //     displayOrder: 4,
    //     iconKey: iconKey ?? null,
    //     iconUrl: iconUrl ?? null,
    //     createdAt: new Date().toISOString(),
    //   };
    //   return res
    //     .status(201)
    //     .success(toCategoryResponse(created, 0), "카테고리 생성 성공 (mock)");
    // }

    const { created, wordCount } = await createCategoryService({
      userId,
      name,
      iconKey: iconKey ?? null,
      iconUrl: iconUrl ?? null,
    });

    return res
      .status(201)
      .success(toCategoryResponse(created, wordCount), "카테고리 생성 성공");
  } catch (e) {
    next(e);
  }
};

export const patchCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { id } = req.params;
    const { name } = req.body;

    validateName(name, { required: false });

    // // Mock 테스트용(수정)
    // if (
    //   process.env.NODE_ENV === "development" &&
    //   process.env.MOCK_DB === "true"
    // ) {
    //   const updated = {
    //     id,
    //     userId,
    //     categoryName: name ?? "기존이름(mock)",
    //     displayOrder: 4,
    //     iconKey: req.body.iconKey ?? null,
    //     iconUrl: req.body.iconUrl ?? null,
    //     updatedAt: new Date().toISOString(),
    //   };
    //   return res
    //     .status(200)
    //     .success(toCategoryResponse(updated, 0), "카테고리 수정 성공 (mock)");
    // }

    const iconKeyProvided = Object.prototype.hasOwnProperty.call(
      req.body,
      "iconKey",
    );
    const iconUrlProvided = Object.prototype.hasOwnProperty.call(
      req.body,
      "iconUrl",
    );

    if (iconKeyProvided || iconUrlProvided) {
      validateIcon(
        {
          iconKey: iconKeyProvided ? req.body.iconKey : undefined,
          iconUrl: iconUrlProvided ? req.body.iconUrl : undefined,
        },
        { required: true },
      );
    }

    const { updated, wordCount } = await patchCategoryService({
      userId,
      id,
      ...(name !== undefined ? { name } : {}),
      ...(iconKeyProvided ? { iconKey: req.body.iconKey ?? null } : {}),
      ...(iconUrlProvided ? { iconUrl: req.body.iconUrl ?? null } : {}),
    });

    return res
      .status(200)
      .success(toCategoryResponse(updated, wordCount), "카테고리 수정 성공");
  } catch (e) {
    next(e);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new BaseError("인증이 필요합니다", 401, "AUTH001");

    const { id } = req.params;

    // Mock 테스트용(삭제)
    // if (
    //   process.env.NODE_ENV === "development" &&
    //   process.env.MOCK_DB === "true"
    // ) {
    //   const result = { deletedCategoryId: id, deletedWordCount: 0 };
    //   return res
    //     .status(200)
    //     .success(toCategoryDeleteResponse(result), "카테고리 삭제 성공 (mock)");
    // }

    const result = await removeCategoryService({ userId, id });

    return res
      .status(200)
      .success(toCategoryDeleteResponse(result), "카테고리 삭제 성공");
  } catch (e) {
    next(e);
  }
};
