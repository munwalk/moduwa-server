import { BaseError } from "../errors/app.error.js";

export const validateDeleteRoutineBody = (body) => {
  const { ids } = body ?? {};

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BaseError("ids는 최소 1개 이상 필요합니다.", 400);
  }

  const normalized = Array.from(new Set(ids)).map((v) => String(v).trim());

  for (const id of normalized) {
    if (!id) {
      throw new BaseError("ids에는 빈 값이 들어올 수 없습니다.", 400);
    }
  }

  return { ids: normalized };
};
