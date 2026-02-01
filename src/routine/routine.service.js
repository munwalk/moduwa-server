import {
  findRoutineMessagesByUser,
  createRoutineMessage,
  findRoutineById,
  updateRoutineMessage,
  deleteAllRoutineMessagesByUser,
  deleteRoutineMessagesByIds,
} from "./routine.repository.js";
import { BaseError } from "../errors/app.error.js";
import { toRoutineDto, toRoutineDtoList } from "./routine.dto.js";

// GET
export const getRoutineList = async ({ userId }) => {
  const rows = await findRoutineMessagesByUser({ userId });
  return toRoutineDtoList(rows);
};

// POST
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

// PATCH
export const updateRoutine = async ({ routineId, userId, patchData }) => {
  const routine = await findRoutineById({ id: routineId });

  if (!routine) {
    throw new BaseError("루틴 문장을 찾을 수 없습니다.", 404);
  }

  if (routine.userId !== userId) {
    throw new BaseError("수정 권한이 없습니다.", 403);
  }

  const updated = await updateRoutineMessage({
    id: routineId,
    data: patchData,
  });

  return toRoutineDto(updated);
};

// DELETE - 선택 삭제
export const deleteRoutines = async ({ userId, ids }) => {
  const result = await deleteRoutineMessagesByIds({ userId, ids });

  return {
    deletedCount: result.count,
    deletedIds: ids,
  };
};

// DELETE - 전체 삭제
export const deleteAllRoutines = async ({ userId }) => {
  const result = await deleteAllRoutineMessagesByUser({ userId });

  return {
    deletedCount: result.count,
  };
};
