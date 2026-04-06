# LikeSlack 바이브 코딩 전환 계획

## 배경
신규 프로젝트를 바이브 코딩 친화적 구조로 처음부터 구축.
AI 코딩 어시스턴트와 효율적 협업을 위한 문서화, 자동화, 테스트 인프라 완비.

## 완료 항목
1. [x] CLAUDE.md 생성
2. [x] OpenSpec 문서 (docs/specs/) — 프로젝트 개요, API, DB 스키마
3. [x] ADR 문서 (docs/adr/) — 기술 스택, 테스트 전략
4. [x] ESLint + Prettier 설정
5. [x] 테스트 자동화 — Vitest unit 11개 + Supertest integration 10개 = 21개 통과
6. [x] Claude 스킬 5개 생성 (.claude/commands/)
7. [x] Git Hook — pre-commit (lint-staged), pre-push (test)
8. [x] PM2 배포 설정 (ecosystem.config.js)
9. [x] 보안 개선 — 세션 시크릿, 쿠키 보안, 보안 헤더, 메시지 길이 제한

## 보류 항목 (gh CLI 설치 필요)
10. [ ] GitHub 이슈 Epic + Task 등록
11. [ ] GitHub Actions CI/CD

## 향후 권장
12. [ ] E2E 테스트 (Playwright)
13. [ ] 번들러 도입 (Rollup/Vite) — 프론트엔드 모듈화
14. [ ] rate limiting 미들웨어 추가
15. [ ] CSRF 토큰 적용
16. [ ] 로깅 시스템 (winston/pino)
