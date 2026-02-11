import { BaseError } from "../errors/app.error.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import {
  countDuplicateCategoryName,
  createUserCategory,
  findUserCategoryById,
  updateUserCategory,
  countUserWordsInCategory,
  deleteCategoryAndWords,
  listUserCategories,
} from "./category.repository.js";

/* =====================================================
   카테고리 생성
===================================================== */

export const createCategoryService = async ({
  userId,
  name,
  iconKey,
  iconUrl,
}) => {
  const dup = await countDuplicateCategoryName({
    userId,
    categoryName: name,
  });

  if (dup > 0)
    throw new BaseError("이미 존재하는 카테고리명입니다", 409, "CAT_DUP");

  const created = await createUserCategory({
    userId,
    categoryName: name,
    iconKey,
    iconUrl,
  });

  const wordCount = await countUserWordsInCategory({
    userId,
    userCategoryId: created.id,
  });

  return { created, wordCount };
};

/* =====================================================
   카테고리 목록 조회
   - 기본 + 사용자 모두 userCategory에서 조회
   - isDefault 여부만 다름
===================================================== */

export const getCategoryListService = async ({ userId }) => {
  // 1️⃣ 현재 유저 카테고리 조회
  let categories = await listUserCategories({ userId });

  // 2️⃣ 기본 카테고리가 하나도 없다면 자동 생성
  const hasDefault = categories.some((c) => c.isDefault);

  if (!hasDefault) {
    const DEFAULT_ICON_MAP = {
      최근사용: "ICON_RECENT",
      즐겨찾기: "ICON_FAVORITE",
      기본: "ICON_BASIC",
      사람: "ICON_PERSON",
      행동: "ICON_ACTION",
      감정: "ICON_EMOTION",
      음식: "ICON_FOOD",
      장소: "ICON_PLACE",
      신체: "ICON_BODY",
    };

    const defaultNames = Object.keys(DEFAULT_ICON_MAP);

    await prisma.userCategory.createMany({
      data: defaultNames.map((name, index) => ({
        userId,
        categoryName: name,
        iconKey: DEFAULT_ICON_MAP[name],
        displayOrder: index,
        isDefault: true,
      })),
    });

    // 다시 조회
    categories = await listUserCategories({ userId });
  }

  // 3️⃣ wordCount 계산
  return Promise.all(
    categories.map(async (c) => {
      let wordCount = 0;

      if (c.isDefault) {
        wordCount = await prisma.word.count({
          where: {
            category: {
              categoryName: c.categoryName,
            },
            isDefault: true,
          },
        });
      } else {
        wordCount = await countUserWordsInCategory({
          userId,
          userCategoryId: c.id,
        });
      }

      return {
        category: c,
        wordCount,
      };
    }),
  );
};

/* =====================================================
   카테고리 수정
   - 기본 카테고리는 이름 수정 금지
===================================================== */

export const patchCategoryService = async ({
  userId,
  id,
  name,
  iconKey,
  iconUrl,
}) => {
  const existing = await findUserCategoryById({ userId, id });

  if (!existing)
    throw new BaseError("카테고리를 찾을 수 없습니다", 404, "CAT404");

  // 기본 카테고리 이름 수정 방지
  if (existing.isDefault && name !== undefined) {
    throw new BaseError(
      "기본 카테고리 이름은 수정할 수 없습니다",
      400,
      "CAT_DEFAULT_EDIT",
    );
  }

  if (name !== undefined) {
    const dup = await countDuplicateCategoryName({
      userId,
      categoryName: name,
      excludeId: id,
    });

    if (dup > 0)
      throw new BaseError("이미 존재하는 카테고리명입니다", 409, "CAT_DUP");
  }

  const data = {
    ...(name !== undefined ? { categoryName: name } : {}),
    ...(iconKey !== undefined ? { iconKey } : {}),
    ...(iconUrl !== undefined ? { iconUrl } : {}),
  };

  const updated = await updateUserCategory({ userId, id, data });

  const wordCount = existing.isDefault
    ? 0
    : await countUserWordsInCategory({
        userId,
        userCategoryId: id,
      });

  return { updated, wordCount };
};

/* =====================================================
   카테고리 삭제
   - 기본 카테고리 삭제 금지
===================================================== */

export const removeCategoryService = async ({ userId, id }) => {
  const existing = await findUserCategoryById({ userId, id });

  if (!existing)
    throw new BaseError("카테고리를 찾을 수 없습니다", 404, "CAT404");

  if (existing.isDefault) {
    throw new BaseError(
      "기본 카테고리는 삭제할 수 없습니다",
      400,
      "CAT_DEFAULT_DELETE",
    );
  }

  const deletedWordCount = await deleteCategoryAndWords({
    userId,
    userCategoryId: id,
  });

  return { categoryId: id, deletedWordCount };
};
