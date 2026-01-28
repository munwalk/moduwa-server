import { findRoutineMessagesByUser } from "./routine.repository.js";
import { toRoutineDtoList } from "./routine.dto.js";

export const getRoutineList = async ({ userId }) => {
  const rows = await findRoutineMessagesByUser({ userId });
  return toRoutineDtoList(rows);
};
