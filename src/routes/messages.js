const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get messages for a channel (with pagination)
router.get('/:channelId', requireAuth, (req, res) => {
  const { channelId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before; // cursor-based pagination

  const db = getDb();

  // Check membership and get last_read_at
  const member = db.prepare('SELECT last_read_at FROM channel_members WHERE channel_id = ? AND user_id = ?').get(
    channelId, req.session.userId
  );
  if (!member) {
    return res.status(403).json({ error: '채널에 참가하지 않았습니다' });
  }
  const lastReadAt = member.last_read_at;

  let messages;
  if (before) {
    messages = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar_color, u.avatar_url,
        (SELECT COUNT(*) FROM messages r WHERE r.parent_id = m.id) as reply_count
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.parent_id IS NULL AND m.created_at < ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(channelId, before, limit);
  } else {
    messages = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar_color, u.avatar_url,
        (SELECT COUNT(*) FROM messages r WHERE r.parent_id = m.id) as reply_count
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = ? AND m.parent_id IS NULL
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(channelId, limit);
  }

  // Get reactions for each message
  const getReactions = db.prepare(`
    SELECT r.emoji, r.user_id, u.display_name
    FROM reactions r
    JOIN users u ON r.user_id = u.id
    WHERE r.message_id = ?
  `);

  // Count how many members have read each message
  const totalMembers = db.prepare('SELECT COUNT(*) as cnt FROM channel_members WHERE channel_id = ?').get(channelId).cnt;
  const getReadCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM channel_members
    WHERE channel_id = ? AND last_read_at >= ? AND user_id != ?
  `);

  messages = messages.map(msg => ({
    ...msg,
    reactions: getReactions.all(msg.id),
    readCount: getReadCount.get(channelId, msg.created_at, msg.user_id).cnt,
    totalMembers: totalMembers - 1, // exclude sender
  }));

  // Update last_read_at
  db.prepare('UPDATE channel_members SET last_read_at = datetime(?) WHERE channel_id = ? AND user_id = ?').run(
    'now', channelId, req.session.userId
  );

  res.json({ messages: messages.reverse(), lastReadAt });
});

// Get thread messages
router.get('/:channelId/thread/:parentId', requireAuth, (req, res) => {
  const { channelId, parentId } = req.params;
  const db = getDb();

  const parent = db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar_color
    FROM messages m JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(parentId);

  const replies = db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar_color
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.parent_id = ?
    ORDER BY m.created_at ASC
  `).all(parentId);

  const getReactions = db.prepare(`
    SELECT r.emoji, r.user_id, u.display_name
    FROM reactions r JOIN users u ON r.user_id = u.id
    WHERE r.message_id = ?
  `);

  const allMessages = [parent, ...replies].filter(Boolean).map(msg => ({
    ...msg,
    reactions: getReactions.all(msg.id),
  }));

  res.json(allMessages);
});

// Search messages
router.get('/search/query', requireAuth, (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: '검색어는 2자 이상이어야 합니다' });
  }

  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, u.username, u.display_name, u.avatar_color, u.avatar_url, c.name as channel_name
    FROM messages m
    JOIN users u ON m.user_id = u.id
    JOIN channels c ON m.channel_id = c.id
    JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
    WHERE m.content LIKE ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all(req.session.userId, `%${q}%`);

  res.json(messages);
});

module.exports = router;
