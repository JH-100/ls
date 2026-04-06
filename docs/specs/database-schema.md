# Database Schema

## users
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| username | TEXT UNIQUE | 로그인 ID (2-20자) |
| password_hash | TEXT | bcrypt 해시 |
| display_name | TEXT | 표시 이름 |
| avatar_color | TEXT | 아바타 색상 (#hex) |
| status | TEXT | online/offline |
| last_seen | TEXT | 마지막 접속 시간 |
| created_at | TEXT | 생성 시간 |

## channels
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| name | TEXT | 채널 이름 |
| description | TEXT | 설명 |
| is_dm | INTEGER | DM 여부 (0/1) |
| created_by | TEXT FK→users | 생성자 |
| created_at | TEXT | 생성 시간 |

## channel_members
| Column | Type | Description |
|--------|------|-------------|
| channel_id | TEXT PK,FK→channels | |
| user_id | TEXT PK,FK→users | |
| joined_at | TEXT | 참가 시간 |
| last_read_at | TEXT | 마지막 읽은 시간 |

## messages
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| channel_id | TEXT FK→channels | |
| user_id | TEXT FK→users | |
| content | TEXT | 메시지 내용 (HTML 이스케이프됨) |
| parent_id | TEXT FK→messages | 스레드 부모 (null=루트) |
| file_url | TEXT | 첨부파일 URL |
| file_name | TEXT | 원본 파일명 |
| file_type | TEXT | MIME 타입 |
| edited | INTEGER | 수정 여부 (0/1) |
| created_at | TEXT | |
| updated_at | TEXT | |

## reactions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| message_id | TEXT FK→messages | |
| user_id | TEXT FK→users | |
| emoji | TEXT | 이모지 문자 |
| UNIQUE(message_id, user_id, emoji) | | 중복 방지 |

## notifications
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| user_id | TEXT FK→users | |
| channel_id | TEXT FK→channels | |
| message_id | TEXT FK→messages | |
| is_read | INTEGER | 읽음 여부 (0/1) |

## Indexes
- idx_messages_channel (channel_id, created_at)
- idx_messages_parent (parent_id)
- idx_reactions_message (message_id)
- idx_notifications_user (user_id, is_read)
- idx_channel_members_user (user_id)
