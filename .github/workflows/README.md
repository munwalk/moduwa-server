# GitHub Actions CI/CD 파이프라인 설정 가이드

## 🎯 현재 구성

- **CI (Continuous Integration)**: 코드 푸시/PR 시 자동 빌드 검증
- **CD (Continuous Deployment)**: develop 브랜치 푸시 시 EC2 자동 배포

## 🚀 워크플로우 설명

### 1. `ci.yml` - 지속적 통합 (CI)
**트리거**: 
- Pull Request 생성/업데이트 (develop, main 브랜치 대상)
- 코드 푸시 (develop, main, feature/*, fix/*, hotfix/* 브랜치)

**동작**:
1. **Backend 빌드 검증**
   - Node.js 20 환경 설정
   - npm 의존성 설치
   - Prisma Client 생성
   - JavaScript 문법 검증
   - Docker 이미지 빌드 테스트

2. **FastAPI 빌드 검증**
   - Python 3.11 환경 설정
   - pip 의존성 설치
   - Python 문법 검증
   - Docker 이미지 빌드 테스트

3. **Docker Compose 검증**
   - docker-compose.yml 설정 검증
   - MySQL/Redis 컨테이너 시작 테스트

### 2. `cd-dev.yml` - 개발 서버 자동 배포
**트리거**: 
- develop 브랜치 푸시
- 수동 실행 (Actions 탭에서 workflow_dispatch)

**동작**:
1. **Docker 이미지 빌드 & 푸시**
   - Backend, FastAPI 이미지를 GitHub Container Registry (GHCR)에 업로드
   - `ghcr.io/moduwa-aac/moduwa-server/backend:latest`
   - `ghcr.io/moduwa-aac/moduwa-server/fastapi:latest`
   - Docker 빌드 캐시를 활용하여 빌드 속도 최적화

2. **개발 서버 배포 (EC2_HOST)**
   - SSH로 개발 서버 접속 (ubuntu@{EC2_HOST})
   - 최신 코드 pull (develop 브랜치)
   - GHCR에서 최신 이미지 pull
   - 기존 컨테이너 중지 및 제거 (`docker-compose down`)
   - 새 컨테이너 시작 (`docker-compose up -d`)
   - **컨테이너 개수 검증**: docker-compose.yml에 정의된 서비스 개수와 실행 중인 컨테이너 개수 비교
   - **Prisma 마이그레이션 자동 실행**: `npx prisma migrate deploy`
   - **헬스체크**: Backend (포트 3000), FastAPI (포트 8000) 응답 확인
   - 구버전 이미지 정리 (`docker image prune -f`)

### 3. `cd-prod.yml` - 프로덕션 서버 자동 배포
**트리거**: 
- main 브랜치 푸시
- 수동 실행 (Actions 탭에서 workflow_dispatch)

**동작**:
1. **Docker 이미지 빌드 & 푸시**
   - Backend, FastAPI 이미지를 GitHub Container Registry (GHCR)에 업로드
   - `ghcr.io/moduwa-aac/moduwa-server/backend:production`
   - `ghcr.io/moduwa-aac/moduwa-server/fastapi:production`
   - Docker 빌드 캐시를 활용하여 빌드 속도 최적화

2. **프로덕션 서버 배포 (EC2_HOST_PROD)**
   - SSH로 프로덕션 서버 접속 (ubuntu@{EC2_HOST_PROD})
   - 최신 코드 pull (main 브랜치)
   - GHCR에서 최신 이미지 pull
   - 기존 컨테이너 중지 및 제거 (`docker-compose down`)
   - 새 컨테이너 시작 (`docker-compose up -d`)
   - **컨테이너 개수 검증**: docker-compose.yml에 정의된 서비스 개수와 실행 중인 컨테이너 개수 비교
   - **Prisma 마이그레이션 자동 실행**: `npx prisma migrate deploy`
   - **헬스체크**: Backend (포트 3000), FastAPI (포트 8000) 응답 확인
   - 구버전 이미지 정리 (`docker image prune -f`)

## �️ EC2 서버 초기 설정 (최초 1회만)

배포 자동화를 사용하기 전에 EC2 서버에서 다음 작업을 수행해야 합니다:

### 1. Docker 및 Docker Compose 설치
```bash
# Docker 설치
sudo apt update
sudo apt install -y docker.io

# Docker Compose 설치
sudo apt install -y docker-compose

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
newgrp docker
```

### 2. 프로젝트 클론
```bash
cd /home/ubuntu
git clone https://github.com/moduwa-aac/moduwa-server.git
cd moduwa-server
git checkout develop  # develop 브랜치로 전환
```

### 3. 환경 변수 파일 생성
```bash
# Backend .env
vi .env
# 필요한 환경변수 입력 후 저장
# (DATABASE_URL, REDIS_URL, JWT_SECRET, KAKAO_CLIENT_ID 등)

# FastAPI .env
vi fastapi-server/.env
# 필요한 환경변수 입력 후 저장
# (OPENAI_API_KEY 등)
```

### 4. 시스템 MySQL 중지 (포트 충돌 방지)
Docker Compose가 MySQL 컨테이너를 3306 포트로 실행하므로, 시스템에 설치된 MySQL이 있다면 중지:
```bash
# MySQL 실행 여부 확인
sudo systemctl status mysql

# 실행 중이면 중지 및 자동 시작 비활성화
sudo systemctl stop mysql
sudo systemctl disable mysql
```

### 5. 초기 배포 테스트
GitHub Actions에서 첫 배포를 수동으로 실행:
```
Repository → Actions → CD Deploy → Run workflow → Run workflow 버튼 클릭
```

초기 배포 성공 후, 이후부터는 develop 브랜치에 코드가 푸시될 때마다 자동으로 배포됩니다.

---

## 📋 필요한 GitHub Secrets 설정

**설정 경로**: Repository → Settings → Secrets and variables → Actions → New repository secret

### 🔐 필수 Secrets

| Secret 이름 | 설명 | 사용처 | 예시 |
|------------|------|-------|------|
| `EC2_HOST` | 개발 서버 IP 주소 | develop 배포 | `52.78.164.88` |
| `EC2_SSH_KEY` | 개발 서버 SSH 프라이빗 키 | develop 배포 | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `EC2_HOST_PROD` | 프로덕션 서버 IP 주소 | main 배포 | `43.201.123.45` |
| `EC2_SSH_KEY_PROD` | 프로덕션 서버 SSH 프라이빗 키 | main 배포 | `-----BEGIN RSA PRIVATE KEY-----\n...` |

> **참고**: 
> - `GITHUB_TOKEN`은 자동으로 제공되므로 별도 설정이 필요 없습니다.
> - 개발/프로덕션 서버가 동일한 경우 `EC2_HOST_PROD`와 `EC2_SSH_KEY_PROD`에 동일한 값을 설정하세요.

## 🔄 배포 플로우

### Development (develop 브랜치)
```
1. feature 브랜치에서 개발
   ↓
2. develop 브랜치로 PR 생성 → CI 자동 실행 (검증만)
   ↓
3. PR 머지 → develop 브랜치
   ↓
4. CD 자동 실행 → 개발 서버 배포 🚀
   ├─ Docker 이미지 빌드 & GHCR 푸시 (backend:latest, fastapi:latest)
   ├─ 개발 서버 SSH 접속 (EC2_HOST)
   ├─ develop 브랜치 코드 pull
   ├─ Docker Compose로 컨테이너 재시작
   ├─ Prisma 마이그레이션 실행
   └─ 헬스체크 & 배포 완료 확인
```

### Production (main 브랜치)
```
1. develop 브랜치 테스트 완료
   ↓
2. main 브랜치로 PR 생성 → CI 자동 실행 (검증)
   ↓
3. PR 머지 → main 브랜치
   ↓
4. CD 자동 실행 → 프로덕션 서버 배포 🔥
   ├─ Docker 이미지 빌드 & GHCR 푸시 (backend:production, fastapi:production)
   ├─ 프로덕션 서버 SSH 접속 (EC2_HOST_PROD)
   ├─ main 브랜치 코드 pull
   ├─ Docker Compose로 컨테이너 재시작
   ├─ Prisma 마이그레이션 실행
   └─ 헬스체크 & 배포 완료 확인
```

## 📝 사용법

### 1️⃣ 코드 푸시 시 CI 자동 실행
```bash
git add .
git commit -m "[feat]: 새로운 기능 추가"
git push origin feature/new-feature
```

### 2️⃣ PR 생성 시 자동 검증
```bash
# GitHub에서 PR 생성
feature/new-feature → develop
# → CI가 자동 실행되어 빌드 검증
```

### 3️⃣ PR 머지 후 자동 배포
```bash
# PR 머지 완료
# → develop 브랜치에 반영
# → CD가 자동 실행되어 EC2에 배포
```

### 4️⃣ 결과 확인
**GitHub Repository → Actions 탭**에서 실시간 로그 확인 가능

## 🐛 트러블슈팅

### CI 실패 시

**npm install 실패**
→ `package.json` 의존성 확인 또는 `package-lock.json` 삭제 후 재생성

**Python 문법 에러**
→ `fastapi-server/main.py` 코드 검토

**Docker 빌드 실패**
→ `Dockerfile` 또는 `fastapi-server/Dockerfile` 검토

**Docker Compose 에러**
→ `docker-compose.yml` 문법 및 서비스 설정 확인

### CD 실패 시

**SSH 접속 실패**
→ `EC2_HOST`, `EC2_SSH_KEY` 값 확인
→ EC2 보안 그룹에서 22번 포트 열려있는지 확인
→ SSH 키 형식이 올바른지 확인 (BEGIN/END 포함)

**git pull 실패**
→ EC2 서버에 프로젝트가 클론되어 있는지 확인
→ `/home/ubuntu/moduwa-server` 경로 존재 여부 확인

**docker pull 실패**
→ GHCR 권한 문제: 워크플로우의 `permissions: packages: write` 확인
→ 이미지가 Public으로 설정되어 있는지 확인

**docker-compose 실패**
→ EC2 서버의 `.env` 파일 확인 (루트, fastapi-server 폴더 모두)
→ 환경변수가 제대로 설정되어 있는지 확인

**컨테이너 개수 검증 실패**
→ 일부 컨테이너가 시작하지 못한 경우
→ GitHub Actions 로그에서 `docker-compose logs` 확인
→ 포트 충돌(3306, 6379, 3000, 8000) 확인

**Prisma 마이그레이션 실패**
→ DATABASE_URL 환경변수 확인
→ MySQL 컨테이너가 정상 실행 중인지 확인

**헬스체크 실패**
→ Backend/FastAPI가 정상적으로 시작되지 않은 경우
→ 컨테이너 로그에서 에러 확인

## 📞 로그 확인
**GitHub Actions 실행 로그**: Repository → Actions 탭 → 해당 워크플로우 클릭
