# API Reference

## REST API

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | 회원가입 (username, password, displayName) |
| POST | /api/auth/login | 로그인 (username, password) |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 현재 사용자 정보 |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/channels | 참가 중인 채널 목록 |
| POST | /api/channels | 채널 생성 (name, description) |
| POST | /api/channels/dm | DM 채널 생성/조회 (userId) |
| POST | /api/channels/:id/join | 채널 참가 |
| POST | /api/channels/:id/leave | 채널 탈퇴 |
| GET | /api/channels/:id/members | 채널 멤버 목록 |
| GET | /api/channels/browse/all | 전체 공개 채널 목록 |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages/:channelId | 메시지 히스토리 (?limit, ?before) |
| GET | /api/messages/:channelId/thread/:parentId | 스레드 메시지 |
| GET | /api/messages/search/query | 메시지 검색 (?q) |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/files/upload | 파일 업로드 (multipart/form-data) |

## Socket.IO Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| join-channel | channelId | 채널 룸 참가 |
| leave-channel | channelId | 채널 룸 탈퇴 |
| send-message | {channelId, content, parentId?, fileUrl?} | 메시지 전송 |
| edit-message | {messageId, content} | 메시지 수정 |
| delete-message | {messageId} | 메시지 삭제 |
| add-reaction | {messageId, emoji} | 이모지 반응 토글 |
| typing | {channelId} | 타이핑 알림 |
| mark-read | {channelId} | 읽음 처리 |
| get-users | callback | 전체 사용자 목록 |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| new-message | message | 새 메시지 |
| message-edited | message | 수정된 메시지 |
| message-deleted | {messageId, channelId} | 삭제된 메시지 |
| reactions-updated | {messageId, reactions[]} | 반응 업데이트 |
| thread-update | {parentId, replyCount} | 스레드 카운트 |
| user-status | {userId, status} | 온라인 상태 변경 |
| online-users | userId[] | 현재 온라인 사용자 |
| user-typing | {channelId, userId, displayName} | 타이핑 표시 |
| unread-update | {channelId} | 안 읽은 메시지 |
