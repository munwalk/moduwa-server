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

### 2. `cd-deploy.yml` - 자동 배포 (CD)
**트리거**: 
- develop 브랜치 푸시
- 수동 실행 (Actions 탭에서)

**동작**:
1. **Docker 이미지 빌드 & 푸시**
   - GitHub Container Registry (GHCR)에 이미지 업로드
   - `ghcr.io/{owner}/{repo}/backend:latest`
   - `ghcr.io/{owner}/{repo}/fastapi:latest`

2. **EC2 서버 배포**
   - SSH로 서버 접속
   - 최신 코드 pull (develop 브랜치)
   - GHCR에서 최신 이미지 pull
   - Docker Compose로 컨테이너 재시작
   - 구버전 이미지 정리

## 📋 필요한 GitHub Secrets 설정

**Repository → Settings → Secrets and variables → Actions**

### 🔐 현재 설정된 Secrets
```
EC2_HOST: EC2 서버 IP 주소
EC2_USER: ubuntu
EC2_SSH_KEY: SSH 프라이빗 키
```

## 🔄 배포 플로우

```
1. feature 브랜치에서 개발
   ↓
2. develop 브랜치로 PR 생성 → CI 자동 실행 (검증만)
   ↓
3. PR 머지 → develop 브랜치
   ↓
4. CD 자동 실행 → EC2 서버 배포 🚀
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
→ EC2_HOST, EC2_USER, EC2_SSH_KEY 값 확인
→ EC2 보안 그룹에서 22번 포트 열려있는지 확인

**git pull 실패**
→ EC2 서버에 프로젝트가 클론되어 있는지 확인
→ `/home/ubuntu/moduwa-server` 경로 존재 여부 확인

**docker pull 실패**
→ GHCR 권한 문제: 워크플로우의 `permissions: packages: write` 확인
→ 이미지가 Public으로 설정되어 있는지 확인

**docker-compose 실패**
→ EC2 서버의 `.env` 파일 확인
→ 환경변수가 제대로 설정되어 있는지 확인

## 📞 로그 확인
**GitHub Actions 실행 로그**: Repository → Actions 탭 → 해당 워크플로우 클릭
