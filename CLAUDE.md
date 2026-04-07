# LikeSlack - 로컬 네트워크 메신저

## 프로젝트 개요
같은 네트워크 내 Mac/Windows 브라우저에서 접근하는 슬랙 스타일 실시간 메신저

## Tech Stack
- **Backend**: Node.js + Express 5 + Socket.IO 4
- **Frontend**: React 19 + Vite 6 (client/ 디렉토리)
- **Database**: SQLite (better-sqlite3, WAL 모드)
- **File Upload**: multer (50MB 제한, 드래그앤드롭)
- **Auth**: bcrypt + express-session
- **HTTPS**: 자체서명 인증서 (PWA 지원)

## 프로젝트 구조
```
server.js              # Express + Socket.IO + HTTPS 진입점 (포트 3333)
src/                   # 백엔드
  database.js          # SQLite 초기화/스키마/쿼리
  routes/              # REST API (auth, channels, messages, files)
  socket/              # Socket.IO 이벤트 (chat, presence)
  middleware/          # 인증 미들웨어
client/                # React 프론트엔드 소스
  src/
    App.jsx            # 라우터 + 프로바이더
    contexts/          # Auth, Channel, Message, Socket, Theme 컨텍스트
    components/        # 35개 React 컴포넌트
    hooks/             # 커스텀 훅
    utils/             # 유틸리티 함수
    styles/global.css  # 슬랙 스타일 다크/라이트 테마
  vite.config.js       # Vite 빌드 설정 (output → public/)
public/                # Vite 빌드 출력 (자동 생성)
uploads/               # 업로드된 파일
data/                  # SQLite DB (likeslack.db)
certs/                 # SSL 인증서 (git 제외)
tests/                 # unit + integration 테스트
docs/                  # OpenSpec 문서
```

## 주요 명령어
```bash
npm start              # 서버 시작 (node server.js)
npm run dev            # 개발 모드 (--watch)
npm run build          # React 빌드 (client/ → public/)
npm run client:dev     # Vite 개발 서버 (포트 5173)
npm test               # 테스트 실행 (vitest)
npm run lint           # ESLint 검사
npm run format         # Prettier 포맷팅
```

## DB 스키마
- users, channels, channel_members, messages, reactions, notifications
- 외래키 ON, WAL 모드

## 핵심 기능
- 채널 (생성/참가/탈퇴) + DM + 그룹 채팅
- 실시간 메시지 (Socket.IO)
- 파일/이미지 업로드 (드래그앤드롭) 및 미리보기
- 이모지 반응 (토글)
- 스레드 (답글)
- 메시지 검색
- 읽음 표시 (안 읽음 / N명 읽음 / 모두 읽음)
- 새 메시지 구분선
- 안 읽은 메시지 뱃지
- 온라인/오프라인 상태
- 타이핑 인디케이터
- 다크/라이트 모드
- PWA (앱 설치, 데스크탑 알림, 배지)
- 자동 업데이트 (서버 재시작 시 30초 내 클라이언트 리로드)
- 자동 로그인
- 프로필 수정 (이름, 아바타 색상)
- 멤버 초대

## 개발 규칙
- 커밋에 Co-Authored-By 포함하지 않음
- XSS 방지: 모든 사용자 입력은 sanitizeHtml() 적용
- SQL injection 방지: parameterized queries 사용
- 파일 업로드: MIME 타입 화이트리스트 + 크기 제한
- 세션 기반 인증, Socket.IO도 세션 공유
- React 컴포넌트는 함수형 + hooks 사용
- 상태 관리: Context API (Redux 없음)

## 네트워크
- 0.0.0.0 바인딩으로 같은 네트워크 내 접속 가능
- HTTPS 자체서명 인증서로 PWA 설치 지원
- 서버 시작 시 로컬 IP 자동 표시
