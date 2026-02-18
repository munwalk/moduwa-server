import { BaseError, UnauthorizedError } from "../errors/app.error.js";
import {
  getRoutineList,
  createRoutine,
  updateRoutine,
  deleteRoutines,
  deleteAllRoutines,
} from "./routine.service.js";
import {
  validateCreateRoutineBody,
  validateUpdateRoutineBody,
} from "./routine.validator.js";
import { validateDeleteRoutineBody } from "./routine.delete.validator.js";

// 모달 관련 validator
const validateSnoozeBody = (body) => {
  const { minutes } = body ?? {};
  if (minutes === undefined) return { minutes: 5 };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
    throw new BaseError("minutes는 1~60 정수만 허용됩니다.", 400);
  }
  return { minutes };
};

// MOCK 설정
const isMockMode = () =>
  process.env.NODE_ENV === "development" && process.env.MOCK_DB === "true";

const buildMockRoutine = ({ userId, message, scheduledTime }) => {
  const now = new Date();
  return {
    id: `mock-${now.getTime()}`,
    userId,
    message,
    scheduledTime,
    repeatType: "WEEKLY",
    daysOfWeek: [2, 4, 6],
    daysOfMonth: null,
    isMonthEnd: false,
    isActive: true,
    snoozedUntil: null,
    dismissedUntil: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

// GET
export const getRoutines = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");

    const routines = await getRoutineList({ userId });
    return res.success({ routines }, "루틴 문장 목록 조회 성공");
  } catch (err) {
    next(err);
  }
};

// POST
export const postRoutine = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");

    const {
      message,
      scheduledTime,
      repeatType,
      daysOfWeek,
      daysOfMonth,
      isMonthEnd,
    } = validateCreateRoutineBody(req.body);

    // MOCK
    // if (isMockMode()) {
    //   const routine = buildMockRoutine({ userId, message, scheduledTime });
    //   return res.success({ routine }, "루틴 문장 생성 성공 (mock)");
    // }

    const routine = await createRoutine({
      userId,
      message,
      scheduledTime,
      repeatType,
      daysOfWeek,
      daysOfMonth,
      isMonthEnd,
    });

    return res.success({ routine }, "루틴 문장 생성 성공");
  } catch (err) {
    next(err);
  }
};

// PATCH
export const patchRoutine = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    const routineId = req.params.id;

    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");
    if (!routineId) throw new BaseError("routineId가 필요합니다.", 400);

    const patchData = validateUpdateRoutineBody(req.body);

    const routine = await updateRoutine({
      routineId,
      userId,
      patchData,
    });

    return res.success({ routine }, "루틴 문장 수정 성공");
  } catch (err) {
    next(err);
  }
};

// DELETE - 선택 삭제
export const deleteSelectedRoutines = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");

    const { ids } = validateDeleteRoutineBody(req.body);

    const result = await deleteRoutines({ userId, ids });
    return res.success(result, "루틴 문장 선택 삭제 성공");
  } catch (err) {
    next(err);
  }
};

// DELETE - 전체 삭제
export const deleteAllRoutinesController = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");

    const result = await deleteAllRoutines({ userId });
    return res.success(result, "루틴 문장 전체 삭제 성공");
  } catch (err) {
    next(err);
  }
};

// 자동 출력 문장 모달 전용 API

// 오늘의 요일(1~7, 월=1..일=7)
const getKoreanDow = (date) => {
  const js = date.getDay();
  return js === 0 ? 7 : js;
};

// 이번 달 말일
const getLastDayOfMonth = (date) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  return new Date(y, m + 1, 0).getDate();
};

// 루틴이 "지금(오늘/현재시간)" 실행 대상인지 판단

const isDueNow = (routine, now) => {
  if (!routine.isActive) return false;

  // 오늘 끄기 상태면 차단
  if (routine.dismissedUntil && new Date(routine.dismissedUntil) > now)
    return false;

  const snoozedUntil = routine.snoozedUntil
    ? new Date(routine.snoozedUntil)
    : null;

  // 스누즈 우선 처리
  if (snoozedUntil) {
    if (now < snoozedUntil) return false;
    // snoozedUntil이 지났으면 즉시 노출
    return true;
  }

  // 정규 스케줄 시간 비교 (HH:MM)
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = `${hh}:${mm}`;

  if (routine.scheduledTime !== current) return false;

  const rt = routine.repeatType ?? "WEEKLY";

  if (rt === "DAILY") return true;

  if (rt === "WEEKLY" || rt === "BIWEEKLY") {
    const today = getKoreanDow(now);
    const dows = Array.isArray(routine.daysOfWeek) ? routine.daysOfWeek : [];
    return dows.includes(today);
  }

  if (rt === "MONTHLY") {
    const day = now.getDate();
    const doms = Array.isArray(routine.daysOfMonth) ? routine.daysOfMonth : [];
    const last = getLastDayOfMonth(now);

    const hitByDom = doms.includes(day);
    const hitByEnd = routine.isMonthEnd === true && day === last;

    return hitByDom || hitByEnd;
  }

  return false;
};

// GET /api/routines/modal
export const getRoutineModal = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");

    const now = new Date();

    // MOCK
    // if (isMockMode()) {
    //   const routine = buildMockRoutine({
    //     userId,
    //     message: "물을 끓여와주세요.",
    //     scheduledTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    //   });
    //   return res.success({ routine }, "자동 출력 문장 모달 조회 성공 (mock)");
    // }

    const routines = await getRoutineList({ userId });

    const due = routines.find((r) => isDueNow(r, now)) ?? null;

    return res.success(
      {
        routine: due,
        actions: {
          snoozeMinutes: 5,
          canSnooze: !!due,
          canDismiss: !!due,
        },
        serverTime: now.toISOString(),
      },
      "자동 출력 문장 모달 조회 성공",
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/routines/:id/modal/snooze
export const snoozeRoutineModal = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    const routineId = req.params.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");
    if (!routineId) throw new BaseError("routineId가 필요합니다.", 400);

    const { minutes } = validateSnoozeBody(req.body);

    const now = new Date();
    const until = new Date(now.getTime() + minutes * 60 * 1000);

    const routine = await updateRoutine({
      routineId,
      userId,
      patchData: {
        snoozedUntil: until,
      },
    });

    return res.success(
      { routine, snoozedUntil: until.toISOString() },
      "자동 출력 문장 5분 뒤 다시 알림 설정 성공",
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/routines/:id/modal/dismiss
export const dismissRoutineModal = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;
    const routineId = req.params.id;
    if (!userId) throw new UnauthorizedError("인증 정보가 없습니다.");
    if (!routineId) throw new BaseError("routineId가 필요합니다.", 400);

    const now = new Date();
    // 오늘 자정까지
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );

    const routine = await updateRoutine({
      routineId,
      userId,
      patchData: {
        dismissedUntil: endOfDay,
        snoozedUntil: null,
      },
    });

    return res.success(
      { routine, dismissedUntil: endOfDay.toISOString() },
      "자동 출력 문장 끄기(오늘) 성공",
    );
  } catch (err) {
    next(err);
  }
};
