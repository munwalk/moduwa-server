import { BaseError } from "../errors/app.error.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new BaseError("인증이 필요합니다", 401, "AUTH001");
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new BaseError(
        "Authorization 형식이 올바르지 않습니다",
        401,
        "AUTH001"
      );
    }

    // token을 userId로 간주
    req.user = { userId: token };
    return next();
  } catch (err) {
    return next(err);
  }
};

export default authMiddleware;
