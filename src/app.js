import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pmRouter from "./pm/pm.route.js";
import {
  AiPredictionTimeoutError,
  UnauthorizedError,
} from "./errors/app.error.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger/swagger.js";

import ttsRouter from "./tts/tts.route.js";


// 환경변수 설정
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 1. 공통 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));

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
console.log("[ROUTE] mounting /api/pm");
app.use("/api/pm", pmRouter);

// 3. 테스트용 라우트
app.use("/api/ai/tts", ttsRouter);

// 성공 케이스 테스트
app.get("/", (req, res) => {
  const sampleData = { project: "moduwa-server", status: "Running" };
  res.success(sampleData, "서버가 정상 작동 중입니다.");
});

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

// 5. 전역 에러 핸들러 (반드시 최하단에 위치)
app.use((err, req, res, next) => {
  // 이미 응답 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

  // 운영 에러 (예측 가능한 에러)
  if (err.isOperational) {
    return res.status(err.statusCode).error({
      code: err.code,
      message: err.message,
      detail: err.detail || null,
    });
  }

  // 프로그래밍 에러 (예측 불가능한 시스템 에러)
  console.error("ERROR:", err); // 서버 로그용
  return res.status(500).error({
    code: "SERVER_ERROR",
    message: "서버 내부 오류가 발생했습니다",
    detail: process.env.NODE_ENV === "development" ? err.message : null, // 개발 환경에서만 상세 출력
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
