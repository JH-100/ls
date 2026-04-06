# ADR-002: 테스트 전략

## Status: Accepted

## Context
바이브 코딩 환경에서 리팩토링 안전망이 필요.
코드 변경 시 기존 기능이 깨지지 않음을 보장해야 함.

## Decision
- **Vitest**: 유닛 + 통합 테스트 프레임워크 (빠르고 ESM 네이티브)
- **Supertest**: HTTP API 통합 테스트
- **ESLint + Prettier**: 코드 스타일 일관성
- **커버리지 목표**: Unit 70%, Integration 핵심 API 100%

## Test Scope
1. **Unit**: DB CRUD 로직 (users, channels, messages, reactions)
2. **Integration**: REST API 엔드포인트 (auth, channels, messages)
3. **Lint**: 코드 스타일 + 잠재적 오류 검출

## Automation
- pre-commit: lint-staged (ESLint + Prettier)
- pre-push: 전체 테스트 실행
- CI: GitHub Actions (추후 설정)

## Consequences
- E2E 테스트는 현재 미포함 (Playwright 추후 도입 가능)
- Socket.IO 이벤트는 수동 테스트로 검증
