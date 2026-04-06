# LikeSlack - 로컬 네트워크 메신저

## 프로젝트 개요
같은 네트워크 내 Mac/Windows 브라우저에서 접근하는 슬랙 스타일 실시간 메신저

## Tech Stack
- **Backend**: Node.js + Express 5 + Socket.IO 4
- **Frontend**: 바닐라 HTML/CSS/JS (프레임워크 없음)
- **Database**: SQLite (better-sqlite3, WAL 모드)
- **File Upload**: multer (50MB 제한)
- **Auth**: bcrypt + express-session

## 프로젝트 구조
```
server.js          # Express + Socket.IO 진입점 (포트 3333)
src/
  database.js      # SQLite 초기화/스키마/쿼리
  routes/          # REST API (auth, channels, messages, files)
  socket/          # Socket.IO 이벤트 (chat, presence)
  middleware/      # 인증 미들웨어
public/            # 프론트엔드 정적 파일
  js/              # app.js, socket.js, ui.js, utils.js, emoji.js
  css/style.css    # 슬랙 스타일 다크/라이트 테마
uploads/           # 업로드된 파일
data/              # SQLite DB (likeslack.db)
tests/             # unit + integration 테스트
docs/              # OpenSpec 문서
```

## 주요 명령어
```bash
npm start          # 서버 시작 (node server.js)
npm run dev        # 개발 모드 (--watch)
npm test           # 테스트 실행 (vitest)
npm run lint       # ESLint 검사
npm run format     # Prettier 포맷팅
```

## DB 스키마
- users, channels, channel_members, messages, reactions, notifications
- 외래키 ON, WAL 모드

## 핵심 기능
- 채널 (생성/참가/탈퇴) + DM
- 실시간 메시지 (Socket.IO)
- 파일/이미지 업로드 및 미리보기
- 이모지 반응 (토글)
- 스레드 (답글)
- 메시지 검색
- 안 읽은 메시지 뱃지
- 온라인/오프라인 상태
- 타이핑 인디케이터
- 다크/라이트 모드

## 개발 규칙
- 커밋에 Co-Authored-By 포함하지 않음
- XSS 방지: 모든 사용자 입력은 sanitizeHtml() 적용
- SQL injection 방지: parameterized queries 사용
- 파일 업로드: MIME 타입 화이트리스트 + 크기 제한
- 세션 기반 인증, Socket.IO도 세션 공유

## 네트워크
- 0.0.0.0 바인딩으로 같은 네트워크 내 접속 가능
- 서버 시작 시 로컬 IP 자동 표시
