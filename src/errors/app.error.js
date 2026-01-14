class BaseError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // 운영 에러(예측 가능) 구분
    }
}

// AI 관련 에러 (예시)
class AiPredictionTimeoutError extends BaseError {
    constructor(message = 'AI 응답 시간 초과') {
        super(message, 408, 'AI001');
    }
}

class AiModelError extends BaseError {
    constructor(message = 'AI 모델 오류') {
        super(message, 500, 'AI002');
    }
}

// 인증 관련 에러 (공통)
class UnauthorizedError extends BaseError {
    constructor(message = '인증이 필요합니다') {
        super(message, 401, 'AUTH001');
    }
}

class ForbiddenError extends BaseError {
    constructor(message = '권한이 없습니다') {
        super(message, 403, 'AUTH002');
    }
}



// ==========================================
// Auth 관련 에러
// ==========================================

class TokenExpiredError extends BaseError {
    constructor(message = '토큰이 만료되었습니다') {
        super(message, 401, 'AUTH003');
    }
}

class InvalidTokenError extends BaseError {
    constructor(message = '유효하지 않은 토큰입니다') {
        super(message, 401, 'AUTH004');
    }
}

class UserNotFoundError extends BaseError {
    constructor(message = '사용자를 찾을 수 없습니다') {
        super(message, 404, 'AUTH005');
    }
}

class NotGuestAccountError extends BaseError {
    constructor(message = '게스트 계정만 수행할 수 있습니다') {
        super(message, 403, 'AUTH006');
    }
}

class SocialAccountAlreadyLinkedError extends BaseError {
    constructor(message = '이미 다른 계정과 연동된 소셜 계정입니다') {
        super(message, 409, 'AUTH007');
    }
}

class InvalidRefreshTokenError extends BaseError {
    constructor(message = '유효하지 않은 리프레시 토큰입니다') {
        super(message, 401, 'AUTH008');
    }
}

class ValidationError extends BaseError {
    constructor(message = '입력값이 올바르지 않습니다', detail = null) {
        super(message, 400, 'VALIDATION001');
        this.detail = detail;
    }
}

// export에 추가
export {
    BaseError,
    AiPredictionTimeoutError,
    AiModelError,
    UnauthorizedError,
    ForbiddenError,
    TokenExpiredError,
    InvalidTokenError,
    UserNotFoundError,
    NotGuestAccountError,
    SocialAccountAlreadyLinkedError,
    InvalidRefreshTokenError,
    ValidationError
};