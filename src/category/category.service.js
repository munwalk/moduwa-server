import { BaseError } from "../errors/app.error.js";
import {
  countDuplicateCategoryName,
  createUserCategory,
  findUserCategoryById,
  updateUserCategory,
  countUserWordsInCategory,
  deleteCategoryAndWords,
  listUserCategories,
} from "./category.repository.js";

export const createCategoryService = async ({
  userId,
  name,
  iconKey,
  iconUrl,
}) => {
  const dup = await countDuplicateCategoryName({ userId, categoryName: name });
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

export const getCategoryListService = async ({ userId }) => {
  const categories = await listUserCategories({ userId });
  return categories.map((c) => ({
    category: c,
    wordCount: 0,
  }));
};

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
  const wordCount = await countUserWordsInCategory({
    userId,
    userCategoryId: id,
  });

  return { updated, wordCount };
};

export const removeCategoryService = async ({ userId, id }) => {
  const existing = await findUserCategoryById({ userId, id });
  if (!existing)
    throw new BaseError("카테고리를 찾을 수 없습니다", 404, "CAT404");

  const deletedWordCount = await deleteCategoryAndWords({
    userId,
    userCategoryId: id,
  });

  return { categoryId: id, deletedWordCount };
};
