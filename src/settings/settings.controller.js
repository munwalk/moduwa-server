import { UnauthorizedError } from "../errors/app.error.js";
import { getGridColumns } from "./settings.service.js";
import { validateUpdateGridBody } from "./settings.validator.js";
import { updateGridColumns } from "./settings.service.js";

// GET
export const getGridSettings = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    const gridColumns = await getGridColumns({ userId });

    if (typeof res.success === "function") {
      return res.success({ gridColumns }, "그리드 설정 조회 성공");
    }

    return res.status(200).json({
      success: true,
      data: { gridColumns },
      message: "그리드 설정 조회 성공",
    });
  } catch (err) {
    next(err);
  }
};

// PATCH
export const patchGridSettings = async (req, res, next) => {
  try {
    const userId = req.user?.userId ?? req.userId ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedError("인증 정보가 없습니다.");
    }

    const { gridColumns } = validateUpdateGridBody(req.body);

    const settings = await updateGridColumns({ userId, gridColumns });

    if (typeof res.success === "function") {
      return res.success(
        { gridColumns: settings.gridColumns },
        "그리드 설정 변경 성공",
      );
    }

    return res.status(200).json({
      success: true,
      message: "그리드 설정 변경 성공",
      data: { gridColumns: settings.gridColumns },
    });
  } catch (err) {
    next(err);
  }
};
