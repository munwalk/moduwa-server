import { BaseError } from "../errors/app.error.js";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ALLOWED_REPEAT_TYPES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

const normalizeRepeatType = (repeatType) => {
  if (repeatType === undefined || repeatType === null || repeatType === "") {
    return "WEEKLY";
  }
  if (!ALLOWED_REPEAT_TYPES.includes(repeatType)) {
    throw new BaseError(
      "repeatType은 DAILY/WEEKLY/BIWEEKLY/MONTHLY 중 하나여야 합니다.",
      400,
    );
  }
  return repeatType;
};

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

const normalizeDaysOfMonth = (daysOfMonth) => {
  if (!Array.isArray(daysOfMonth) || daysOfMonth.length === 0) {
    throw new BaseError("daysOfMonth는 최소 1개 이상 선택해야 합니다.", 400);
  }

  const unique = Array.from(new Set(daysOfMonth));
  for (const d of unique) {
    if (!Number.isInteger(d) || d < 1 || d > 31) {
      throw new BaseError(
        "daysOfMonth는 1~31 범위의 정수 배열이어야 합니다.",
        400,
      );
    }
  }

  return unique.sort((a, b) => a - b);
};

const normalizeIsMonthEnd = (isMonthEnd) => {
  if (isMonthEnd === undefined) return false;
  if (typeof isMonthEnd !== "boolean") {
    throw new BaseError("isMonthEnd는 boolean 이어야 합니다.", 400);
  }
  return isMonthEnd;
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

// 생성(POST)
export const validateCreateRoutineBody = (body) => {
  const {
    message,
    scheduledTime,
    repeatType,
    daysOfWeek,
    daysOfMonth,
    isMonthEnd,
  } = body ?? {};

  const rt = normalizeRepeatType(repeatType);
  const ime = normalizeIsMonthEnd(isMonthEnd);

  const base = {
    message: normalizeMessage(message),
    scheduledTime: normalizeScheduledTime(scheduledTime),
    repeatType: rt,
    isMonthEnd: ime,
  };

  if (rt === "DAILY") {
    return { ...base, daysOfWeek: null, daysOfMonth: null };
  }

  if (rt === "MONTHLY") {
    // daysOfMonth 또는 isMonthEnd 중 하나는 있어야 함
    const hasDaysOfMonth = daysOfMonth !== undefined && daysOfMonth !== null;
    if (!hasDaysOfMonth && !ime) {
      throw new BaseError(
        "MONTHLY는 daysOfMonth 또는 isMonthEnd=true 중 하나가 필요합니다.",
        400,
      );
    }

    return {
      ...base,
      daysOfWeek: null,
      daysOfMonth: hasDaysOfMonth ? normalizeDaysOfMonth(daysOfMonth) : null,
    };
  }

  // 매주/격주
  return {
    ...base,
    daysOfWeek: normalizeDaysOfWeek(daysOfWeek),
    daysOfMonth: null,
  };
};

// return {
//   message: normalizeMessage(message),
//   daysOfWeek: normalizeDaysOfWeek(daysOfWeek),
//   scheduledTime: normalizeScheduledTime(scheduledTime),
// };
// };

// 수정(PATCH)
export const validateUpdateRoutineBody = (body) => {
  const {
    message,
    scheduledTime,
    repeatType,
    daysOfWeek,
    daysOfMonth,
    isMonthEnd,
  } = body ?? {};

  const hasAny =
    message !== undefined ||
    scheduledTime !== undefined ||
    repeatType !== undefined ||
    daysOfWeek !== undefined ||
    daysOfMonth !== undefined ||
    isMonthEnd !== undefined;

  if (!hasAny) {
    throw new BaseError(
      "message, scheduledTime, repeatType, daysOfWeek, daysOfMonth, isMonthEnd 중 하나 이상은 필요합니다.",
      400,
    );
  }

  const result = {};

  if (message !== undefined) result.message = normalizeMessage(message);
  if (scheduledTime !== undefined)
    result.scheduledTime = normalizeScheduledTime(scheduledTime);

  if (repeatType !== undefined)
    result.repeatType = normalizeRepeatType(repeatType);
  if (isMonthEnd !== undefined)
    result.isMonthEnd = normalizeIsMonthEnd(isMonthEnd);

  if (daysOfWeek !== undefined)
    result.daysOfWeek = normalizeDaysOfWeek(daysOfWeek);
  if (daysOfMonth !== undefined)
    result.daysOfMonth = normalizeDaysOfMonth(daysOfMonth);

  const finalRepeatType = result.repeatType;
  if (finalRepeatType === "MONTHLY") {
    const ime = result.isMonthEnd === true;
    const hasDom =
      Array.isArray(result.daysOfMonth) && result.daysOfMonth.length > 0;
    if (!ime && !hasDom) {
      throw new BaseError(
        "repeatType=MONTHLY로 변경 시 daysOfMonth 또는 isMonthEnd=true 중 하나가 필요합니다.",
        400,
      );
    }
    if (result.daysOfWeek !== undefined) {
      throw new BaseError("MONTHLY에서는 daysOfWeek를 보낼 수 없습니다.", 400);
    }
  }

  return result;
};
