import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import passport from "./auth/middlewares/passport.config.js";
import { PrismaClient } from "@prisma/client";
import { initRedis } from "./auth/services/token.service.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

// 라우터
import categoryRouter from "./category/category.route.js";
import ttsRouter from "./tts/tts.route.js";
import aiRouter from "./ai-prediction/routes/ai.prediction.route.js";
import historyRouter from "./history/history.route.js";
import authRoutes from "./auth/routes/auth.routes.js";
import routineRouter from "./routine/routine.route.js";
import settingsRouter from "./settings/settings.route.js";
import orderRouter from "./order/order.route.js";

// 유틸리티
import responseHelper from "./utils/response.util.js";
import errorHandler from "./utils/errorHandler.js";

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
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  }),
);

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 2. 응답 헬퍼 함수 등록
app.use(responseHelper);

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

// 루틴 문장 API
app.use("/api/routines", routineRouter);

// 그리드 커스터마이징 API
app.use("/api/settings", settingsRouter);

// AI 예측 API
app.use("/api/ai", aiRouter);

// TTS API
app.use("/api/ai/tts", ttsRouter);

// History API
app.use("/api/histories", historyRouter);

// Category - order API
app.use("/api/order", orderRouter);

// 성공 케이스 테스트
app.get("/", (req, res) => {
  const sampleData = { project: "moduwa-server", status: "Running" };
  res.success(sampleData, "서버가 정상 작동 중입니다.");
});

// Health Check 추가
app.get("/health/db", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.success({ database: "MySQL" }, "Database connected!");
  } catch (error) {
    next(error);
  }
});

// Auth Routes 추가
app.use("/api/auth", authRoutes);

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

// 5. 전역 에러 핸들러
app.use(errorHandler);

// 서버 실행 (기존 코드 대체)
async function startServer() {
  try {
    await prisma.$connect();
    console.log("[Database] Connected to MySQL");

    await initRedis();
    console.log("[Redis] Connected");

    app.listen(port, () => {
      console.log(`[Server] Running on port ${port}`);
      console.log(`[Environment] ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("[Error] Server startup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`[Shutdown] ${signal} received, closing gracefully...`);
  try {
    await prisma.$disconnect();
    console.log("[Database] Disconnected");
    process.exit(0);
  } catch (error) {
    console.error("[Error] Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
