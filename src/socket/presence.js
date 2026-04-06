const { getDb } = require('../database');

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

function setupPresenceHandlers(io, socket, userId, username) {
  // Add to online tracking
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId).add(socket.id);

  // Update DB status
  const db = getDb();
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('online', userId);

  // Broadcast online status
  io.emit('user-status', { userId, status: 'online' });

  // Send current online users to this socket
  const onlineList = [];
  for (const [uid] of onlineUsers) {
    onlineList.push(uid);
  }
  socket.emit('online-users', onlineList);

  // Get all users for sidebar
  socket.on('get-users', (callback) => {
    const users = db.prepare(`
      SELECT id, username, display_name, avatar_color, status
      FROM users ORDER BY display_name
    `).all();

    // Override DB status with live tracking
    const result = users.map(u => ({
      ...u,
      status: onlineUsers.has(u.id) ? 'online' : 'offline',
    }));
    callback?.(result);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] ${username} disconnected`);

    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        db.prepare('UPDATE users SET status = ?, last_seen = datetime(?) WHERE id = ?').run('offline', 'now', userId);
        io.emit('user-status', { userId, status: 'offline' });
      }
    }
  });
}

module.exports = { setupPresenceHandlers };
