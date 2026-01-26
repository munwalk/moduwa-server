# ==========================================
# Stage 1: Base
# ==========================================
FROM node:20-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 타임존 설정 및 Prisma 필수 라이브러리 설치
# openssl1.1-compat와 libc6-compat를 추가합니다.
RUN apk add --no-cache tzdata openssl openssl-dev libc6-compat python3 make g++
ENV TZ=Asia/Seoul

# ==========================================
# Stage 2: Dependencies
# ==========================================
FROM base AS dependencies

# 패키지 파일 복사
COPY package*.json ./

# npm 타임아웃 설정 (네트워크 에러 방지)
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retries 5


# 의존성 설치 (개발 환경에서는 npm install 사용)
RUN npm install

# ==========================================
# Stage 3: Development
# ==========================================
FROM base AS development

# 의존성 복사
COPY --from=dependencies /app/node_modules ./node_modules

# 소스 코드 복사
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# 포트 노출
EXPOSE 3000

# 개발 모드 실행 (nodemon 사용)
CMD ["npm", "run", "dev"]

# ==========================================
# Stage 4: Production Build
# ==========================================
FROM base AS build

# 의존성 복사
COPY --from=dependencies /app/node_modules ./node_modules

# 소스 코드 복사
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# TypeScript 빌드 (사용 시)
# RUN npm run build

# ==========================================
# Stage 5: Production
# ==========================================
FROM base AS production

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 프로덕션 의존성만 복사
COPY --from=dependencies /app/node_modules ./node_modules

# 소스 코드 복사
COPY --from=build /app .

# 포트 노출
EXPOSE 3000

# 프로덕션 모드 실행
CMD ["npm", "start"]