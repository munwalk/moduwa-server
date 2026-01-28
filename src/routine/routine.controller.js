import { UnauthorizedError } from "../errors/app.error.js";
import { getRoutineList, createRoutine } from "./routine.service.js";
import { validateCreateRoutineBody } from "./routine.validator.js";

export const getRoutines = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

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

export const postRoutine = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    const { message, daysOfWeek, scheduledTime } = validateCreateRoutineBody(
      req.body,
    );

    // 로컬 테스트용
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
