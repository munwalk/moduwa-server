import { getOrCreateUserSettings } from "./settings.repository.js";

export const getGridColumns = async ({ userId }) => {
  // MOCK
  //   if (
  //     process.env.NODE_ENV === "development" &&
  //     process.env.MOCK_DB === "true"
  //   ) {
  //     return 7;
  //   }
  const settings = await getOrCreateUserSettings({ userId });

  return settings.gridColumns ?? 7;
};
