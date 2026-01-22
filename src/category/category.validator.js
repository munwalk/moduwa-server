import { BaseError } from "../errors/app.error.js";

export const validateName = (name, { required }) => {
  if (name === undefined) {
    if (required) throw new BaseError("name은 필수입니다", 400, "CAT001");
    return;
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new BaseError("name 형식이 올바르지 않습니다", 400, "CAT002");
  }
};

export const validateIcon = ({ iconKey, iconUrl }, { required }) => {
  const hasKey = iconKey !== undefined && iconKey !== null;
  const hasUrl = iconUrl !== undefined && iconUrl !== null;

  if (required && !hasKey && !hasUrl) {
    throw new BaseError(
      "iconKey 또는 iconUrl 중 하나는 필수입니다",
      400,
      "CAT003",
    );
  }
  if (hasKey && hasUrl) {
    throw new BaseError(
      "iconKey와 iconUrl은 동시에 사용할 수 없습니다",
      400,
      "CAT004",
    );
  }
  if (hasKey && typeof iconKey !== "string") {
    throw new BaseError("iconKey 형식이 올바르지 않습니다", 400, "CAT005");
  }
  if (hasUrl && typeof iconUrl !== "string") {
    throw new BaseError("iconUrl 형식이 올바르지 않습니다", 400, "CAT006");
  }
};
