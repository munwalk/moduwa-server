import { BaseError } from "../errors/app.error.js";

// categoryName 검증
export const validateCategoryName = (categoryName, { required }) => {
  if (required && (categoryName === undefined || categoryName === null)) {
    throw new BaseError("categoryName은 필수입니다", 400, "PM400");
  }

  // PATCH에서 categoryName을 안 보냈으면 검증 스킵
  if (categoryName === undefined || categoryName === null) return;

  if (typeof categoryName !== "string") {
    throw new BaseError("categoryName은 문자열이어야 합니다", 400, "PM400");
  }

  const trimmed = categoryName.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    throw new BaseError("categoryName은 1~50자여야 합니다", 400, "PM400");
  }
};

// iconKey/iconUrl 검증 : 둘 다 동시에 값이 있으면 안 됨
export const validateIconFields = ({ iconKey, iconUrl }) => {
  const hasIconKey =
    iconKey !== undefined && iconKey !== null && String(iconKey).trim() !== "";
  const hasIconUrl =
    iconUrl !== undefined && iconUrl !== null && String(iconUrl).trim() !== "";

  if (hasIconKey && hasIconUrl) {
    throw new BaseError(
      "iconKey와 iconUrl은 동시에 설정할 수 없습니다",
      400,
      "PM400"
    );
  }
};
