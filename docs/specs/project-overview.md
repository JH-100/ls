# LikeSlack 프로젝트 개요

## 목적
같은 로컬 네트워크 내에서 Mac과 Windows 모두 브라우저로 접속할 수 있는 슬랙 스타일 메신저

## 아키텍처
```
Client (Browser)  <-->  Express (REST API)  <-->  SQLite
       ↕                    ↕
   Socket.IO Client  <-->  Socket.IO Server
```

- **Client**: 바닐라 HTML/CSS/JS SPA
- **Server**: Node.js Express 5 + Socket.IO 4
- **DB**: SQLite (better-sqlite3) WAL 모드
- **File Storage**: 로컬 uploads/ 디렉토리

## 주요 설계 결정
- 프레임워크 없는 바닐라 JS: 의존성 최소화, 빌드 과정 불필요
- SQLite: 별도 DB 서버 설치 불필요, 단일 파일 관리
- express-session: 간단한 세션 기반 인증
- 0.0.0.0 바인딩: 같은 네트워크 내 자동 접속 지원

## 대상 사용자
- 10-50명 규모의 팀/조직
- 외부 서비스(Slack 등) 사용 불가하거나 로컬 통신이 필요한 환경
