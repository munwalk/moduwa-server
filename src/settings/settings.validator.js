import { BaseError } from "../errors/app.error.js";

export const validateUpdateGridBody = (body) => {
  const { gridColumns } = body ?? {};

  if (gridColumns === undefined || gridColumns === null) {
    throw new BaseError("gridColumns는 필수입니다.", 400);
  }

  if (!Number.isInteger(gridColumns)) {
    throw new BaseError("gridColumns는 정수여야 합니다.", 400);
  }

  const allowed = [3, 4, 7];
  if (!allowed.includes(gridColumns)) {
    throw new BaseError("gridColumns는 3, 4, 7 중 하나여야 합니다.", 400);
  }

  return { gridColumns };
};
