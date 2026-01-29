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

export const updateGridColumns = async ({ userId, gridColumns }) => {
  // MOCK
  //   if (
  //     process.env.NODE_ENV === "development" &&
  //     process.env.MOCK_DB === "true"
  //   ) {
  //     return {
  //       id: "mock-settings",
  //       userId,
  //       gridColumns,
  //       updatedAt: new Date().toISOString(),
  //     };
  //   }
  const settings = await upsertUserGridColumns({ userId, gridColumns });
  return settings;
};
