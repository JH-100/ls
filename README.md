# LikeSlack

로컬 네트워크 전용 슬랙 스타일 실시간 메신저

같은 네트워크 안의 Mac/Windows에서 브라우저 또는 PWA 앱으로 접속하는 팀 메신저입니다.

## 스크린샷

```
┌──────────┬─────────────────────────────────┐
│ LikeSlack│  # general                      │
│          │                                  │
│ 채널     │  [메시지 영역]                    │
│ # general│  - 백지현: 안녕하세요              │
│ # random │  - 조은: 반갑습니다 😊             │
│          │    └─ 스레드 (3)                  │
│ DM       │  - 백지현: [파일첨부.pdf]          │
│ 조은     │                                   │
│ 박윤한   │  ┌──────────────────────────────┐ │
│          │  │ 메시지 입력...     📎 😊 전송  │ │
│ 사용자   │  └──────────────────────────────┘ │
│ 🟢 조은  │                                   │
│ ⚫ 수민  │                                   │
└──────────┴──────────────────────────────────┘
```

## 주요 기능

- **채널** — 공개 채널 생성/참가/탈퇴, 멤버 초대
- **DM** — 1:1 다이렉트 메시지
- **그룹 채팅** — 여러 명 선택해서 그룹 대화
- **실시간 메시지** — Socket.IO 기반 즉시 전송/수신
- **파일/이미지 업로드** — 버튼 클릭 또는 드래그앤드롭
- **이모지 반응** — 메시지에 이모지 토글
- **스레드** — 메시지에 답글 달기
- **메시지 검색** — 전체 채널 메시지 검색
- **읽음 표시** — 안 읽음 / N명 읽음 / 모두 읽음
- **새 메시지 구분선** — 마지막으로 읽은 지점 빨간 줄 표시
- **안 읽은 메시지 뱃지** — 사이드바에 숫자 표시
- **온라인/오프라인 상태** — 실시간 접속 상태 표시
- **타이핑 인디케이터** — 상대가 입력 중일 때 표시
- **다크/라이트 모드** — 테마 전환
- **PWA** — 앱으로 설치, 데스크탑 알림, 작업표시줄 배지
- **자동 업데이트** — 서버 재시작 시 30초 내 클라이언트 자동 새로고침
- **자동 로그인** — 로그인 정보 저장, 세션 만료 시 자동 재접속
- **프로필 수정** — 표시 이름, 아바타 색상 변경

## 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Node.js + Express 5 + Socket.IO 4 |
| Frontend | 바닐라 HTML/CSS/JS (프레임워크 없음) |
| Database | SQLite (better-sqlite3, WAL 모드) |
| File Upload | multer (50MB 제한, 드래그앤드롭) |
| Auth | bcrypt + express-session |
| HTTPS | 자체서명 인증서 (로컬 네트워크 PWA 지원) |
| Process | PM2 |
| Test | Vitest + Supertest (21개 테스트) |
| Lint | ESLint + Prettier + Husky |

## 빠른 시작

### 1. 설치

```bash
git clone https://github.com/JH-100/ls.git
cd ls
npm install
```

### 2. HTTPS 인증서 생성 (PWA 앱 설치 지원에 필요)

```bash
mkdir certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=LikeSlack"
```

> 인증서 없이도 HTTP로 동작하지만, 다른 PC에서 PWA 앱 설치가 안 됩니다.

### 3. 서버 실행

```bash
# 직접 실행
npm start

# 또는 PM2로 백그라운드 실행
pm2 start ecosystem.config.js
```

### 4. 접속

- 이 PC: `https://localhost:3333`
- 같은 네트워크 다른 PC: `https://<서버IP>:3333`
  - 자체서명 인증서 경고 → "고급" → "계속 진행"

### 5. 앱으로 설치 (선택)

1. 브라우저에서 접속
2. 메뉴 → "앱 설치" 또는 "사이트를 앱으로 설치"
3. 데스크탑에 LikeSlack 아이콘 생성

## 프로젝트 구조

```
server.js              # Express + Socket.IO + HTTPS 서버
src/
  database.js          # SQLite 초기화/스키마
  routes/
    auth.js            # 회원가입/로그인/프로필 수정
    channels.js        # 채널/DM/그룹 CRUD, 멤버 초대
    messages.js        # 메시지 히스토리/검색/스레드
    files.js           # 파일 업로드
  socket/
    index.js           # Socket.IO 진입점
    chat.js            # 채팅/반응/타이핑/읽음
    presence.js        # 온라인 상태 추적
  middleware/
    auth.js            # 인증 미들웨어
public/
  index.html           # 메인 SPA
  login.html           # 로그인/회원가입
  css/style.css        # 슬랙 스타일 다크/라이트 테마
  js/
    app.js             # 메인 앱 로직
    socket.js          # Socket.IO 클라이언트
    ui.js              # UI 렌더링
    icons.js           # SVG 아이콘 시스템
    emoji.js           # 이모지 피커
    utils.js           # 유틸리티
  sw.js                # Service Worker (PWA)
  manifest.json        # PWA 매니페스트
tests/
  unit/                # DB CRUD 테스트 (11개)
  integration/         # API 통합 테스트 (10개)
docs/
  specs/               # API/DB/프로젝트 명세
  adr/                 # Architecture Decision Records
```

## 명령어

```bash
npm start              # 서버 시작
npm run dev            # 개발 모드 (파일 변경 시 자동 재시작)
npm test               # 테스트 실행
npm run test:coverage  # 테스트 커버리지
npm run lint           # ESLint 검사
npm run format         # Prettier 포맷팅
```

## PM2 배포

```bash
# 설치
npm install -g pm2

# 시작
pm2 start ecosystem.config.js

# 관리
pm2 status             # 상태 확인
pm2 restart likeslack  # 재시작
pm2 logs likeslack     # 로그 확인
pm2 stop likeslack     # 중지
```

## 네트워크 요구사항

- 서버와 클라이언트가 **같은 네트워크** (Wi-Fi/LAN)에 있어야 합니다
- 서버 포트 `3333`이 방화벽에서 허용되어야 합니다
- 외부 인터넷 불필요 — 완전히 로컬에서 동작

## License

MIT
