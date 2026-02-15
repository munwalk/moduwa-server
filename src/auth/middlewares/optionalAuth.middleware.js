import { authenticate } from "./auth.middleware.js";

/**
 * optionalAuthenticate
 * - Authorization 헤더가 없으면 그냥 통과(next)
 * - Authorization 헤더가 있으면 authenticate를 실행
 *   - 성공: req.user 세팅되고 next
 *   - 실패: 기존 authenticate의 에러 응답(401 등)을 그대로 따름
 */
export const optionalAuthenticate = (req, res, next) => {
    const authHeader = req.headers?.authorization;

    // 토큰이 아예 없으면 비로그인으로 간주하고 통과
    if (!authHeader) {
        return next();
    }

    // 토큰이 있으면 기존 authenticate 로직 사용
    return authenticate(req, res, next);
};
