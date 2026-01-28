import { UnauthorizedError } from "../errors/app.error.js";
import { getGridColumns } from "./settings.service.js";

// ✅ PM-06 GET /api/settings/grid
export const getGridSettings = async (req, res, next) => {
  try {
    // 프로젝트에서 userId가 여러 형태로 들어오는 케이스 대응
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
