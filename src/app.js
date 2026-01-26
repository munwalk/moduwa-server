import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet'; 
import session from 'express-session'; 
import passport from './auth/middlewares/passport.config.js';
import { PrismaClient } from '@prisma/client';
import { initRedis } from './auth/services/token.service.js';
 // import pmRouter from "./pm/pm.route.js";
import categoryRouter from "./category/category.route.js";
import {
    AiPredictionTimeoutError,
    UnauthorizedError,
    TokenExpiredError,              
    InvalidTokenError,              
    UserNotFoundError,             
    NotGuestAccountError,           
    SocialAccountAlreadyLinkedError, 
    InvalidRefreshTokenError,     
    ValidationError
} from './errors/app.error.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

import ttsRouter from "./tts/tts.route.js";
import aiRouter from "./ai-prediction/ai.prediction.route.js";
import historyRouter from "./history/history.route.js";

// 환경변수 설정
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// 1. 공통 미들웨어
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));

// Session 추가 (OAuth용)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 2. 응답 헬퍼 함수 등록
app.use((req, res, next) => {
  // 성공 응답
  res.success = (data, message = "요청 성공") => {
    return res.json({
      success: true,
      data,
      message,
    });
  };

  // 실패 응답
  res.error = ({ code = "UNKNOWN", message = "오류 발생", detail = null }) => {
    return res.json({
      success: false,
      error: { code, message, detail },
    });
  };

  next();
});

// +) 라우터 등록
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/categories", categoryRouter);
// PM02 테스트용 : 인증 우회
// app.use(
//   "/api/categories",
//   (req, res, next) => {
//     req.user = { userId: "dev-test-user" };
//     next();
//   },
//   categoryRouter,
// );

// 3. 테스트용 라우트
// AI 예측 API
app.use("/api/ai", aiRouter);

// TTS API
app.use("/api/ai/tts", ttsRouter);

// History API
app.use("/api/histories", historyRouter);

// 성공 케이스 테스트
app.get("/", (req, res) => {
  const sampleData = { project: "moduwa-server", status: "Running" };
  res.success(sampleData, "서버가 정상 작동 중입니다.");
});

// Health Check 추가
app.get('/health/db', async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.success({ database: 'MySQL' }, 'Database connected!');
    } catch (error) {
        next(error);
    }
});

// Auth Routes 추가
import authRoutes from './auth/routes/auth.routes.js';
app.use('/api/auth', authRoutes);

// 에러 케이스 테스트 (직접 throw)
app.get("/error-test", (req, res, next) => {
  // Service 로직에서 에러가 발생했다고 가정
  try {
    throw new AiPredictionTimeoutError("테스트용 AI 타임아웃 발생");
  } catch (error) {
    next(error); // 전역 핸들러로 전달
  }
});

// 인증 에러 테스트
app.get("/auth-test", (req, res, next) => {
  try {
    throw new UnauthorizedError();
  } catch (error) {
    next(error);
  }
});

// 4. 404 Not Found 핸들러
app.use((req, res, next) => {
  res.status(404).error({
    code: "NOT_FOUND",
    message: "요청하신 API 경로를 찾을 수 없습니다.",
  });
});

// 5. 전역 에러 핸들러 (기존 코드 수정)
app.use((err, req, res, next) => {
  // 이미 응답 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

    // Auth 에러 처리 추가
    if (err.message === 'USER_NOT_FOUND') {
        const error = new UserNotFoundError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    if (err.message === 'TOKEN_EXPIRED') {
        const error = new TokenExpiredError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    if (err.message === 'INVALID_TOKEN') {
        const error = new InvalidTokenError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    if (err.message === 'NOT_GUEST_ACCOUNT') {
        const error = new NotGuestAccountError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    if (err.message === 'SOCIAL_ACCOUNT_ALREADY_LINKED') {
        const error = new SocialAccountAlreadyLinkedError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    if (err.message === 'INVALID_REFRESH_TOKEN') {
        const error = new InvalidRefreshTokenError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    // Validation 에러
    if (err.message && err.message.includes('Validation error:')) {
        const error = new ValidationError(err.message);
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    // Prisma 에러 처리
    if (err.code === 'P2002') {
        return res.status(409).error({
            code: 'DUPLICATE_ENTRY',
            message: '중복된 데이터입니다'
        });
    }

    if (err.code === 'P2025') {
        const error = new UserNotFoundError();
        return res.status(error.statusCode).error({
            code: error.code,
            message: error.message
        });
    }

    // 운영 에러 (예측 가능한 에러) 
    if (err.isOperational) {
        return res.status(err.statusCode).error({
            code: err.code,
            message: err.message,
            detail: err.detail || null
        });
    }

    // 프로그래밍 에러 
    console.error('ERROR:', err);
    return res.status(500).error({
        code: 'SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다',
        detail: process.env.NODE_ENV === 'development' ? err.message : null
      });
});

// 서버 실행 (기존 코드 대체)
async function startServer() {
    try {
        await prisma.$connect();
        console.log('[Database] Connected to MySQL');

        await initRedis();
        console.log('[Redis] Connected');

        app.listen(port, () => {
            console.log(`[Server] Running on port ${port}`);
            console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('[Error] Server startup failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`[Shutdown] ${signal} received, closing gracefully...`);
    try {
        await prisma.$disconnect();
        console.log('[Database] Disconnected');
        process.exit(0);
    } catch (error) {
        console.error('[Error] Shutdown error:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

