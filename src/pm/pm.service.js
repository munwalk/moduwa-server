import { PrismaClient } from "@prisma/client";
import {
  createUserCategory,
  findUserCategoryById,
  updateUserCategory,
  deleteUserCategory,
} from "./pm.repository.js";

const prisma = new PrismaClient();

import { BaseError } from "../errors/app.error.js";

export const createPm02Category = async ({ userId, categoryName }) => {
  const maxResult = await prisma.userCategory.aggregate({
    where: { userId },
    _max: { displayOrder: true },
  });
  const nextOrder = (maxResult._max.displayOrder ?? -1) + 1;

  try {
    return await createUserCategory({
      userId,
      categoryName,
      displayOrder: nextOrder,
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new BaseError(
        "이미 존재하는 카테고리명입니다",
        409,
        "PM_DUPLICATE_CATEGORY"
      );
    }
    throw err;
  }
};

export const updatePm02Category = async ({ userId, id, categoryName }) => {
  const existing = await findUserCategoryById({ userId, id });
  if (!existing) {
    throw new BaseError(
      "카테고리를 찾을 수 없습니다",
      404,
      "PM_CATEGORY_NOT_FOUND"
    );
  }

  try {
    return await updateUserCategory({
      id,
      ...(categoryName !== undefined ? { categoryName } : {}),
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new BaseError(
        "이미 존재하는 카테고리명입니다",
        409,
        "PM_DUPLICATE_CATEGORY"
      );
    }
    throw err;
  }
};

export const deletePm02Category = async ({ userId, id }) => {
  const existing = await findUserCategoryById({ userId, id });
  if (!existing) {
    throw new BaseError(
      "카테고리를 찾을 수 없습니다",
      404,
      "PM_CATEGORY_NOT_FOUND"
    );
  }

  await deleteUserCategory({ id });
  return true;
};
