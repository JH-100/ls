const { requireAuthSocket } = require('../middleware/auth');
const { setupChatHandlers } = require('./chat');
const { setupPresenceHandlers } = require('./presence');

function setupSocket(io) {
  io.use(requireAuthSocket);

  io.on('connection', (socket) => {
    const userId = socket.request.session.userId;
    const username = socket.request.session.username;

    console.log(`[Socket] ${username} connected`);

    // Send current app version so client can detect updates
    socket.emit('app-version', { version: process.env.APP_VERSION || '' });

    setupChatHandlers(io, socket, userId);
    setupPresenceHandlers(io, socket, userId, username);
  });
}

module.exports = { setupSocket };
