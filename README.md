# Monter Front

바닐라 자바스크립트로 구성된 프론트엔드 프로젝트입니다.

## 도메인 정보

- **프로덕션 도메인**: https://re-switch.co.kr/
- **서버 IP**: 115.68.195.145
- **포트**: 80 (HTTP) / 443 (HTTPS)

## 파일 구조

- `index.html`: 로그인 페이지
- `main.html`: 메인 대시보드 페이지
- `css/`: 스타일시트 파일
  - `login.css`: 로그인 페이지 전용 스타일
  - `main.css`: 대시보드 및 공통 스타일
- `js/`: 자바스크립트 로직
  - `login.js`: 로그인 로직
  - `main.js`: 엔트리 포인트 (라우팅 및 공통 UI 제어)
  - `pages/`: 각 메뉴별 전용 모듈
    - `account.js`: 계정관리 (테이블, 검색, 등록 사이드바 로직)
    - `notice.js`: 공지사항
    - `faq.js`: 자주묻는 질문
    - `ad.js`: 광고관리
    - `settlement.js`: 정산로그
- `server.js`: Express 서버 (프로덕션 배포용)
- `package.json`: Node.js 의존성 관리

## 로컬 실행 방법

이 프로젝트는 정적 파일로 구성되어 있습니다. 다음 방법 중 하나로 실행할 수 있습니다:

1. VS Code의 `Live Server` 확장을 사용합니다.
2. Python이 설치되어 있다면: `python -m http.server`
3. Node.js/npm이 설치되어 있다면: `npx serve .`

## 서버 배포 방법

### 🐳 Docker 사용 (추천)

가장 간단하고 효율적인 방법입니다.

1. Docker 이미지 빌드:
   ```bash
   docker build -t monter-frontend .
   ```

2. Docker Compose로 실행:
   ```bash
   docker-compose up -d
   ```

3. 단일 컨테이너로 실행:
   ```bash
   docker run -d -p 80:80 --name monter-frontend monter-frontend
   ```

4. 서버 접속:
   - 서버 IP: http://115.68.195.145
   - 도메인: https://re-switch.co.kr

**Docker 명령어:**
- 컨테이너 중지: `docker-compose down`
- 로그 확인: `docker-compose logs -f`
- 컨테이너 재시작: `docker-compose restart`

### Node.js Express 서버 사용 시

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 서버 실행:
   ```bash
   npm start
   ```

3. 서버는 `0.0.0.0:80`에서 실행되며, 모든 네트워크 인터페이스에서 접근 가능합니다.
   - 서버 IP: 115.68.195.145
   - 도메인: https://re-switch.co.kr

## 메뉴 구조

### 공지사항
중요한 소식과 업데이트 내용을 확인할 수 있습니다.

### 자주묻는 질문
자주 발생하는 질문들에 대한 답변을 제공합니다.

### 계정관리
계정의 정보를 확인하고, 추가·수정·삭제 등의 관리 작업을 할 수 있습니다.
- **총판사**: 최고 관리자 - 대행사를 가입시킴
- **대행사**: 하위 관리자 - 고객을 가입시킴
- **광고주**: 고객

### 광고관리
진행 중인 광고의 연장·수정·삭제 등의 관리 작업을 할 수 있습니다.

### 정산로그
정산과 관련된 상세 정보를 조회할 수 있습니다.

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Server**: Docker + Nginx (프로덕션) / Node.js + Express (개발)
- **Architecture**: MPA (Multi-Page Application) 방식

## Docker 파일 구조

- `Dockerfile`: 프론트엔드 Docker 이미지 빌드 설정
- `docker-compose.yml`: Docker Compose 설정 (프론트엔드 + 백엔드 확장 가능)
- `nginx.conf`: Nginx 웹 서버 설정
- `.dockerignore`: Docker 빌드 시 제외할 파일 목록
