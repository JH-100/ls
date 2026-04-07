const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');

function setupChatHandlers(io, socket, userId) {
  // Join channel rooms
  socket.on('join-channel', (channelId) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
  });

  // Send message
  socket.on('send-message', (data, callback) => {
    const { channelId, content, parentId, fileUrl, fileName, fileType } = data;

    if (!channelId || (!content && !fileUrl)) {
      return callback?.({ error: '메시지 내용이 필요합니다' });
    }
    if (content && content.length > 10000) {
      return callback?.({ error: '메시지는 10,000자 이하여야 합니다' });
    }

    const db = getDb();

    // Check membership
    const member = db.prepare('SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?').get(channelId, userId);
    if (!member) {
      return callback?.({ error: '채널에 참가하지 않았습니다' });
    }

    const id = uuidv4();
    const sanitizedContent = sanitizeHtml(content || '');

    db.prepare(`
      INSERT INTO messages (id, channel_id, user_id, content, parent_id, file_url, file_name, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, channelId, userId, sanitizedContent, parentId || null, fileUrl || null, fileName || null, fileType || null);

    const message = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar_color, u.avatar_url,
        (SELECT COUNT(*) FROM messages r WHERE r.parent_id = m.id) as reply_count
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(id);

    message.reactions = [];

    // Sender is viewing this channel — update their last_read_at
    db.prepare('UPDATE channel_members SET last_read_at = datetime(?) WHERE channel_id = ? AND user_id = ?').run(
      'now', channelId, userId
    );

    // Emit to channel
    const room = parentId ? `thread:${parentId}` : `channel:${channelId}`;
    io.to(`channel:${channelId}`).emit('new-message', message);

    if (parentId) {
      io.to(`channel:${channelId}`).emit('thread-update', { parentId, replyCount: message.reply_count + 1 });
    }

    // Create notifications for other channel members
    const members = db.prepare('SELECT user_id FROM channel_members WHERE channel_id = ? AND user_id != ?').all(channelId, userId);
    const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, channel_id, message_id) VALUES (?, ?, ?, ?)');
    for (const m of members) {
      insertNotif.run(uuidv4(), m.user_id, channelId, id);
    }

    // Notify about unread
    io.to(`channel:${channelId}`).emit('unread-update', { channelId });

    callback?.({ ok: true, message });
  });

  // Edit message
  socket.on('edit-message', (data, callback) => {
    const { messageId, content } = data;
    const db = getDb();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?').get(messageId, userId);
    if (!msg) {
      return callback?.({ error: '메시지를 찾을 수 없습니다' });
    }

    const sanitized = sanitizeHtml(content);
    db.prepare('UPDATE messages SET content = ?, edited = 1, updated_at = datetime(?) WHERE id = ?').run(sanitized, 'now', messageId);

    const updated = db.prepare(`
      SELECT m.*, u.username, u.display_name, u.avatar_color, u.avatar_url
      FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?
    `).get(messageId);

    io.to(`channel:${msg.channel_id}`).emit('message-edited', updated);
    callback?.({ ok: true });
  });

  // Delete message
  socket.on('delete-message', (data, callback) => {
    const { messageId } = data;
    const db = getDb();

    const msg = db.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?').get(messageId, userId);
    if (!msg) {
      return callback?.({ error: '메시지를 찾을 수 없습니다' });
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
    io.to(`channel:${msg.channel_id}`).emit('message-deleted', { messageId, channelId: msg.channel_id });
    callback?.({ ok: true });
  });

  // Add reaction
  socket.on('add-reaction', (data, callback) => {
    const { messageId, emoji } = data;
    const db = getDb();

    const msg = db.prepare('SELECT channel_id FROM messages WHERE id = ?').get(messageId);
    if (!msg) return callback?.({ error: '메시지를 찾을 수 없습니다' });

    try {
      db.prepare('INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)').run(
        uuidv4(), messageId, userId, emoji
      );
    } catch (e) {
      // Already reacted - remove it (toggle)
      db.prepare('DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').run(messageId, userId, emoji);
    }

    const reactions = db.prepare(`
      SELECT r.emoji, r.user_id, u.display_name
      FROM reactions r JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ?
    `).all(messageId);

    io.to(`channel:${msg.channel_id}`).emit('reactions-updated', { messageId, reactions });
    callback?.({ ok: true });
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { channelId } = data;
    const db = getDb();
    const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId);
    socket.to(`channel:${channelId}`).emit('user-typing', {
      channelId,
      userId,
      displayName: user?.display_name || 'Unknown',
    });
  });

  // Mark channel as read
  socket.on('mark-read', (data) => {
    const { channelId } = data;
    const db = getDb();
    db.prepare('UPDATE channel_members SET last_read_at = datetime(?) WHERE channel_id = ? AND user_id = ?').run(
      'now', channelId, userId
    );
    db.prepare('UPDATE notifications SET is_read = 1 WHERE channel_id = ? AND user_id = ?').run(channelId, userId);

    // Notify others in the channel that this user has read messages
    const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId);
    socket.to(`channel:${channelId}`).emit('channel-read', {
      channelId,
      userId,
      displayName: user?.display_name || '',
    });
  });
}

function sanitizeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { setupChatHandlers };
