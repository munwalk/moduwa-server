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

export {
    BaseError,
    AiPredictionTimeoutError,
    AiModelError,
    UnauthorizedError,
    ForbiddenError
};