# ADR-001: 기술 스택 선택

## Status: Accepted

## Context
로컬 네트워크 전용 슬랙 스타일 메신저를 구축해야 함.
Mac과 Windows 모두 지원, 10-50명 규모.

## Decision
- **Node.js + Express 5**: 실시간 통신에 적합, 비동기 I/O
- **Socket.IO**: WebSocket 기반 실시간 양방향 통신
- **SQLite (better-sqlite3)**: 별도 DB 서버 불필요, 단일 파일
- **바닐라 JS**: 프레임워크 없이 빌드 과정 제거, 의존성 최소화
- **PM2**: 프로세스 관리, 자동 재시작

## Alternatives Considered
- **PHP + Ratchet**: WebSocket 지원 제한적
- **Python + FastAPI**: Socket.IO 지원이 Node.js보다 약함
- **React/Vue**: 빌드 필요, 프로젝트 규모 대비 과도
- **Docker**: 이 규모에서는 PM2가 더 간단

## Consequences
- 양호: 설치 간단, 실시간 통신 우수, 단일 언어(JS)로 풀스택
- 주의: SQLite는 동시 쓰기에 제한 (WAL 모드로 완화)
