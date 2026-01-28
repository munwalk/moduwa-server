import { UnauthorizedError } from "../errors/app.error.js";
import { getRoutineList } from "./routine.service.js";

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
