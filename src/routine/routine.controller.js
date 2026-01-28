import { BaseError, UnauthorizedError } from "../errors/app.error.js";
import { getRoutineList, createRoutine } from "./routine.service.js";
import {
  validateCreateRoutineBody,
  validateUpdateRoutineBody,
} from "./routine.validator.js";

// MOCK 설정
const isMockMode = () =>
  process.env.NODE_ENV === "development" && process.env.MOCK_DB === "true";

const buildMockRoutine = ({ message, daysOfWeek, scheduledTime, userId }) => {
  const now = new Date();
  return {
    id: `mock-${now.getTime()}`,
    userId,
    message,
    daysOfWeek,
    scheduledTime,
    isActive: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

// GET
export const getRoutines = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    // Mock
    // if (
    //   process.env.NODE_ENV === "development" &&
    //   process.env.MOCK_DB === "true"
    // ) {
    //   const routines = [
    //     {
    //       id: "mock-1700000000000",
    //       userId,
    //       message: "물을 끓여와주세요",
    //       daysOfWeek: [2, 4, 6],
    //       scheduledTime: "08:30",
    //       isActive: true,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString(),
    //     },
    //     {
    //       id: "mock-1700000000001",
    //       userId,
    //       message: "저는 몸이 불편합니다.",
    //       daysOfWeek: [2, 4, 6],
    //       scheduledTime: "09:00",
    //       isActive: true,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString(),
    //     },
    //   ];

    //   return res.success({ routines }, "루틴 문장 목록 조회 성공 (mock)");
    // }

    // 실구현
    const routines = await getRoutineList({ userId });

    if (typeof res.success === "function") {
      return res.success({ routines }, "루틴 문장 목록 조회 성공");
    }

    return res.status(200).json({
      success: true,
      message: "루틴 문장 목록 조회 성공",
      data: { routines },
    });
  } catch (err) {
    next(err);
  }
};

// POST
export const postRoutine = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    const { message, daysOfWeek, scheduledTime } = validateCreateRoutineBody(
      req.body,
    );

    // MOCK
    // if (
    //   process.env.NODE_ENV === "development" &&
    //   process.env.MOCK_DB === "true"
    // ) {
    //   const userId = req.user?.userId ?? "dev-test-user";
    //   const { message, daysOfWeek, scheduledTime } = req.body;

    //   return res.status(201).success(
    //     {
    //       id: "mock-routine-id",
    //       userId,
    //       message,
    //       daysOfWeek,
    //       scheduledTime,
    //       isActive: true,
    //       createdAt: new Date().toISOString(),
    //     },
    //     "루틴 생성 성공 (mock)",
    //   );
    // }

    // 실구현
    const routine = await createRoutine({
      userId,
      message,
      daysOfWeek,
      scheduledTime,
    });

    if (typeof res.success === "function") {
      return res
        .status(201)
        .json(res.success({ routine }, "루틴 문장 생성 성공"));
    }

    return res.status(201).json({
      success: true,
      message: "루틴 문장 생성 성공",
      data: { routine },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH
export const patchRoutine = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId;
    const routineId = req.params.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    if (!routineId) {
      throw new BaseError("routineId가 필요합니다.", 400);
    }

    const patchData = validateUpdateRoutineBody(req.body);

    //MOCK
    // if (isMockMode()) {
    //   const routine = {
    //     id: routineId,
    //     userId,
    //     isActive: true,
    //     createdAt: new Date().toISOString(),
    //     updatedAt: new Date().toISOString(),
    //     ...patchData,
    //   };

    //   if (typeof res.success === "function") {
    //     return res.success({ routine }, "루틴 문장 수정 성공 (mock)");
    //   }

    //   return res.status(200).json({
    //     success: true,
    //     message: "루틴 문장 수정 성공 (mock)",
    //     data: { routine },
    //   });
    // }

    // 실구현
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
