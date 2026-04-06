# 이슈 관리 스킬

GitHub 이슈를 등록하고 관리합니다.

## 이슈 등록 템플릿
```
## 작업 배경
(왜 이 작업이 필요한지)

## 작업 개요
(무엇을 할 것인지)

## 인수조건
- [ ] 조건1
- [ ] 조건2

## 의존 관계
(다른 이슈와의 관계)

## 비고
(병렬 수행 가능 여부 등)
```

## 지시사항
1. 이슈 내용을 위 템플릿에 맞춰 작성
2. `gh issue create --repo JH-100/ls --title "..." --body "..."`로 등록
3. 적절한 라벨 추가 (bug, enhancement, documentation 등)
4. 완료 시 인수조건 확인 후 `gh issue close`

## 참고
- 레포: https://github.com/JH-100/ls
- docs/vibe-coding-transition-plan.md — 전환 계획
