# GitHub Actions CI 파이프라인 설정 가이드

## ? 현재 구성

이 프로젝트는 **CI (Continuous Integration)** 파이프라인만 구축되어 있습니다.  
코드 푸시/PR 시 자동으로 빌드 검증이 실행됩니다.

## ? 워크플로우 설명

### `ci.yml` - 지속적 통합 (CI)
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

## ? 사용법

### 1?? 코드 푸시 시 자동 실행
```bash
git add .
git commit -m "[feat]: 새로운 기능 추가"
git push origin feature/new-feature
```

### 2?? PR 생성 시 자동 검증
```bash
# GitHub에서 PR 생성
feature/new-feature → develop
```

### 3?? 결과 확인
**GitHub Repository → Actions 탭**에서 실시간 로그 확인 가능

## ? CI 통과 조건

- Node.js 빌드 성공
- Python 빌드 성공
- Docker 이미지 빌드 성공
- Docker Compose 설정 유효성 검증 통과

## ? 트러블슈팅

### npm install 실패
→ `package.json` 의존성 확인 또는 `package-lock.json` 삭제 후 재생성

### Python 문법 에러
→ `fastapi-server/main.py` 코드 검토

### Docker 빌드 실패
→ `Dockerfile` 또는 `fastapi-server/Dockerfile` 검토

### Docker Compose 에러
→ `docker-compose.yml` 문법 및 서비스 설정 확인

## ? 로그 확인
GitHub Actions 실행 로그: **Repository → Actions 탭 → 해당 워크플로우 클릭**
