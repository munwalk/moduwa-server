import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MODUWA API",
    version: "1.0.0",
    description: "모두와 백엔드 API 문서",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
    { url: "http://52.78.164.88:3000", description: "Development Server" }
  ],

  tags: [
    { name: "Auth", description: "인증/인가 (JWT, OAuth2)" },
    {
      name: "AI",
      description:
        "AI 관련 API - 문장 추천, 대화 저장, 맥락 조회, 스타일 변환, 문장 편집, 즐겨찾기",
    },
    {
      name: "History",
      description:
        "학습 히스토리 관리 - 사용 기록 조회/삭제, 오프라인 낱말 조회",
    },
    { name: "Words", description: "낱말 카드 API" },
    {
      name: "Routines - 자동 출력 문장 API",
      description: "자동 출력 문장(루틴) 관리 + 모달 API",
    },
    {
      name: "Settings - 말하기 화면 설정 API",
      description: "말하기 화면(그리드) 설정 API",
    },
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
      WordCard: {
        type: "object",
        properties: {
          cardId: {
            type: "string",
            format: "uuid",
            description: "낱말 카드 ID (Word.id 또는 UserWord.id)",
            example: "6c10795b-1da1-498e-9bda-d7c23b982ae1",
          },
          categoryId: {
            type: "string",
            format: "uuid",
            description: "카테고리 ID (Category.id 또는 UserCategory.id)",
            example: "4b74596e-5cad-4859-82a1-5cf43f6796fd",
          },
          partOfSpeech: {
            type: "string",
            description: "품사",
            enum: ["NOUN", "VERB", "ADJECTIVE", "MODIFIER", "EMOTION", "NONE"],
            example: "NOUN",
          },
          word: {
            type: "string",
            description: "낱말",
            example: "물",
          },
          imageUrl: {
            type: "string",
            nullable: true,
            description: "이미지 URL",
            example: "https://api.moduwa.com/images/물.png",
          },
          isDefault: {
            type: "boolean",
            description: "기본 낱말 여부",
            example: true,
          },
          isFavorite: {
            type: "boolean",
            description: "즐겨찾기 여부",
            example: false,
          },
          displayOrder: {
            type: "integer",
            description: "표시 순서",
            example: 0,
          },
        },
        required: [
          "cardId",
          "categoryId",
          "partOfSpeech",
          "word",
          "imageUrl",
          "isDefault",
          "isFavorite",
          "displayOrder",
        ],
      },
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
