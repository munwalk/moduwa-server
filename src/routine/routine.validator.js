import { BaseError } from "../errors/app.error.js";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeDaysOfWeek = (daysOfWeek) => {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    throw new BaseError("daysOfWeek는 최소 1개 이상 선택해야 합니다.", 400);
  }

  const uniqueDays = Array.from(new Set(daysOfWeek));
  for (const d of uniqueDays) {
    if (!Number.isInteger(d) || d < 1 || d > 7) {
      throw new BaseError(
        "daysOfWeek는 1~7 범위의 정수 배열이어야 합니다.",
        400,
      );
    }
  }

  return uniqueDays.sort((a, b) => a - b);
};

const normalizeScheduledTime = (scheduledTime) => {
  if (typeof scheduledTime !== "string") {
    throw new BaseError("scheduledTime은 필수입니다.", 400);
  }
  if (!timeRegex.test(scheduledTime)) {
    throw new BaseError("scheduledTime 형식은 HH:MM 입니다.", 400);
  }
  return scheduledTime;
};

const normalizeMessage = (message) => {
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new BaseError("message는 필수입니다.", 400);
  }
  return message.trim();
};

// 생성(POST)용: message/daysOfWeek/scheduledTime 모두 필수

export const validateCreateRoutineBody = (body) => {
  const { message, daysOfWeek, scheduledTime } = body ?? {};

  return {
    message: normalizeMessage(message),
    daysOfWeek: normalizeDaysOfWeek(daysOfWeek),
    scheduledTime: normalizeScheduledTime(scheduledTime),
  };
};

// 수정(PATCH)용: message / daysOfWeek / scheduledTime 중 하나 이상
export const validateUpdateRoutineBody = (body) => {
  const { message, daysOfWeek, scheduledTime } = body ?? {};

  const hasAny =
    message !== undefined ||
    daysOfWeek !== undefined ||
    scheduledTime !== undefined;

  if (!hasAny) {
    throw new BaseError(
      "message, daysOfWeek, scheduledTime 중 하나 이상은 필요합니다.",
      400,
    );
  }

  const result = {};

  if (message !== undefined) {
    result.message = normalizeMessage(message);
  }

  if (daysOfWeek !== undefined) {
    result.daysOfWeek = normalizeDaysOfWeek(daysOfWeek);
  }

  if (scheduledTime !== undefined) {
    result.scheduledTime = normalizeScheduledTime(scheduledTime);
  }

  return result;
};
