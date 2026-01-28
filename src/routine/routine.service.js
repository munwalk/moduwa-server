import {
  findRoutineMessagesByUser,
  createRoutineMessage,
} from "./routine.repository.js";
import { toRoutineDto, toRoutineDtoList } from "./routine.dto.js";

export const getRoutineList = async ({ userId }) => {
  const rows = await findRoutineMessagesByUser({ userId });
  return toRoutineDtoList(rows);
};

export const createRoutine = async ({
  userId,
  message,
  daysOfWeek,
  scheduledTime,
}) => {
  const created = await createRoutineMessage({
    userId,
    message,
    daysOfWeek,
    scheduledTime,
  });

  return toRoutineDto(created);
};
