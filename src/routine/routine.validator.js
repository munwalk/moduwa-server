import { BaseError } from "../errors/app.error.js";

export const validateCreateRoutineBody = (body) => {
  const { message, daysOfWeek, scheduledTime } = body ?? {};

  // 1) message
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new BaseError("message는 필수입니다.");
  }

  // 2) daysOfWeek
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    throw new BaseError("daysOfWeek는 최소 1개 이상 선택해야 합니다.");
  }

  const uniqueDays = Array.from(new Set(daysOfWeek));
  for (const d of uniqueDays) {
    if (!Number.isInteger(d) || d < 1 || d > 7) {
      throw new BaseError("daysOfWeek는 1~7 범위의 정수 배열이어야 합니다.");
    }
  }

  // 3) scheduledTime
  if (typeof scheduledTime !== "string") {
    throw new BaseError("scheduledTime은 필수입니다.");
  }

  // "HH:MM" (00~23):(00~59)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(scheduledTime)) {
    throw new BaseError(
      "scheduledTime 형식은 HH:MM(24시간)이어야 합니다. 예: 09:00",
    );
  }

  return {
    message: message.trim(),
    daysOfWeek: uniqueDays.sort((a, b) => a - b),
    scheduledTime,
  };
};
