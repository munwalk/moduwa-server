import {
  getOrCreateUserSettings,
  upsertUserGridColumns,
} from "./settings.repository.js";

export const getGridColumns = async ({ userId }) => {
  const settings = await getOrCreateUserSettings({ userId });

  return settings.gridColumns ?? 7;
};

export const updateGridColumns = async ({ userId, gridColumns }) => {
  const settings = await upsertUserGridColumns({ userId, gridColumns });
  return settings;
};
