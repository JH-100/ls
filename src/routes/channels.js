const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List channels the user belongs to
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const channels = db.prepare(`
    SELECT c.*, cm.last_read_at,
      (SELECT COUNT(*) FROM messages m
       WHERE m.channel_id = c.id AND m.created_at > cm.last_read_at AND m.user_id != ?) as unread_count
    FROM channels c
    JOIN channel_members cm ON c.id = cm.channel_id
    WHERE cm.user_id = ?
    ORDER BY c.is_dm, c.name
  `).all(req.session.userId, req.session.userId);

  // For DM/group channels, get member info
  const result = channels.map(ch => {
    if (ch.is_dm === 1) {
      const otherUser = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_color, u.status
        FROM channel_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.channel_id = ? AND cm.user_id != ?
      `).get(ch.id, req.session.userId);
      return { ...ch, dmUser: otherUser };
    }
    if (ch.is_dm === 2) {
      const members = db.prepare(`
        SELECT u.id, u.display_name, u.avatar_color, u.status
        FROM channel_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.channel_id = ?
      `).all(ch.id);
      return { ...ch, groupMembers: members, memberCount: members.length };
    }
    return ch;
  });

  res.json(result);
});

// Create channel
router.post('/', requireAuth, (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: '채널 이름을 입력해주세요' });
  }

  const cleanName = name.toLowerCase().replace(/[^a-z0-9가-힣_-]/g, '-').substring(0, 50);

  const db = getDb();
  const existing = db.prepare('SELECT id FROM channels WHERE name = ? AND is_dm = 0').get(cleanName);
  if (existing) {
    return res.status(409).json({ error: '이미 존재하는 채널 이름입니다' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO channels (id, name, description, created_by) VALUES (?, ?, ?, ?)').run(
    id, cleanName, description || '', req.session.userId
  );
  db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(id, req.session.userId);

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  res.json(channel);
});

// Create or get DM channel
router.post('/dm', requireAuth, (req, res) => {
  const { userId } = req.body;

  if (!userId || userId === req.session.userId) {
    return res.status(400).json({ error: '유효하지 않은 사용자입니다' });
  }

  const db = getDb();

  // Check if 1:1 DM already exists
  const existing = db.prepare(`
    SELECT c.id FROM channels c
    JOIN channel_members cm1 ON c.id = cm1.channel_id AND cm1.user_id = ?
    JOIN channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id = ?
    WHERE c.is_dm = 1
  `).get(req.session.userId, userId);

  if (existing) {
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(existing.id);
    return res.json(channel);
  }

  const otherUser = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
  if (!otherUser) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  }

  const id = uuidv4();
  const dmName = `dm-${req.session.username}-${otherUser.username}`;

  db.prepare('INSERT INTO channels (id, name, is_dm, created_by) VALUES (?, ?, 1, ?)').run(
    id, dmName, req.session.userId
  );
  db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(id, req.session.userId);
  db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(id, userId);

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  res.json(channel);
});

// Create group chat (is_dm=2)
router.post('/group', requireAuth, (req, res) => {
  const { name, userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length < 1) {
    return res.status(400).json({ error: '최소 1명 이상의 사용자를 선택해주세요' });
  }

  const db = getDb();

  // Validate all users exist
  const allUserIds = [...new Set([req.session.userId, ...userIds])];
  for (const uid of userIds) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(uid);
    if (!user) {
      return res.status(404).json({ error: '존재하지 않는 사용자가 포함되어 있습니다' });
    }
  }

  // Generate group name from member names if not provided
  let groupName = name?.trim();
  if (!groupName) {
    const members = allUserIds.map(uid =>
      db.prepare('SELECT display_name FROM users WHERE id = ?').get(uid)?.display_name
    ).filter(Boolean);
    groupName = members.join(', ');
    if (groupName.length > 50) groupName = groupName.substring(0, 47) + '...';
  }

  const id = uuidv4();
  db.prepare('INSERT INTO channels (id, name, is_dm, created_by) VALUES (?, ?, 2, ?)').run(
    id, groupName, req.session.userId
  );

  const insertMember = db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)');
  for (const uid of allUserIds) {
    insertMember.run(id, uid);
  }

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  res.json(channel);
});

// Invite user to channel or group chat
router.post('/:id/invite', requireAuth, (req, res) => {
  const { userId } = req.body;
  const db = getDb();

  const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: '채널을 찾을 수 없습니다' });
  }
  if (channel.is_dm === 1) {
    return res.status(400).json({ error: '1:1 DM에는 초대할 수 없습니다' });
  }

  const isMember = db.prepare('SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!isMember) {
    return res.status(403).json({ error: '이 채널의 멤버가 아닙니다' });
  }

  db.prepare('INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(req.params.id, userId);
  res.json({ ok: true });
});

// Join channel
router.post('/:id/join', requireAuth, (req, res) => {
  const db = getDb();
  const channel = db.prepare('SELECT * FROM channels WHERE id = ? AND is_dm = 0').get(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: '채널을 찾을 수 없습니다' });
  }

  db.prepare('INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(
    req.params.id, req.session.userId
  );
  res.json({ ok: true });
});

// Leave channel
router.post('/:id/leave', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?').run(
    req.params.id, req.session.userId
  );
  res.json({ ok: true });
});

// Get channel members
router.get('/:id/members', requireAuth, (req, res) => {
  const db = getDb();
  const members = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_color, u.status
    FROM channel_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.channel_id = ?
    ORDER BY u.display_name
  `).all(req.params.id);
  res.json(members);
});

// Get all public channels (for browsing)
router.get('/browse/all', requireAuth, (req, res) => {
  const db = getDb();
  const channels = db.prepare(`
    SELECT c.*, COUNT(cm.user_id) as member_count
    FROM channels c
    LEFT JOIN channel_members cm ON c.id = cm.channel_id
    WHERE c.is_dm = 0
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(channels);
});

module.exports = router;
