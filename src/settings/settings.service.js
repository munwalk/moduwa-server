import { getOrCreateUserSettings } from "./settings.repository.js";

export const getGridColumns = async ({ userId }) => {
  // ✅ [추가] 로컬 mock 모드면 DB 건드리지 말고 기본값 반환
  if (
    process.env.NODE_ENV === "development" &&
    process.env.MOCK_DB === "true"
  ) {
    return 7;
  }
  const settings = await getOrCreateUserSettings({ userId });

  return settings.gridColumns ?? 7;
};
