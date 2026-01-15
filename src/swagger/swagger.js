import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MODUWA API",
    version: "1.0.0",
    description: "모두와 백엔드 API 문서",
  },
  servers: [{ url: "http://localhost:3000", description: "local" }],

  tags: [
    { name: "Auth", description: "인증/인가 (JWT, OAuth2)" },
    { name: "AI", description: "AI 관련 API" },
    { name: "User", description: "유저 관련 API" },
    { name: "PM02", description: "낱말 카테고리 (생성/수정/삭제)" },
    { name: "PM03", description: "낱말-카테고리 순서 변경" },
    { name: "PM05", description: "루틴 문장 설정" },
    { name: "PM06", description: "그리드 커스터마이징" },
  ],

  components: {
    securitySchemes: {
      // JWT Bearer
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      // 공통 성공 응답
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true, example: { any: "thing" } },
          message: { type: "string", example: "요청 성공" },
        },
        required: ["success", "data", "message"],
      },

      // 공통 실패 응답
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "AI001" },
              message: { type: "string", example: "AI 응답 시간 초과" },
              detail: {
                type: "string",
                nullable: true,
                example: "서버 부하로 인한 지연",
              },
            },
            required: ["code", "message"],
          },
        },
        required: ["success", "error"],
      },
    },

    responses: {
      Unauthorized: {
        description: "인증 필요",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "AUTH001",
                message: "인증이 필요합니다",
                detail: null,
              },
            },
          },
        },
      },
      Forbidden: {
        description: "권한 없음",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "AUTH002",
                message: "권한이 없습니다",
                detail: null,
              },
            },
          },
        },
      },
      AiTimeout: {
        description: "AI 응답 시간 초과",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "AI001",
                message: "AI 응답 시간 초과",
                detail: "서버 부하로 인한 지연",
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/**/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
