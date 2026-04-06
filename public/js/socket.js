// Socket.IO client wrapper
class SocketClient {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.emit('event', 'connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      this.emit('event', 'disconnected');
    });

    // Chat events
    this.socket.on('new-message', (msg) => this.emit('new-message', msg));
    this.socket.on('message-edited', (msg) => this.emit('message-edited', msg));
    this.socket.on('message-deleted', (data) => this.emit('message-deleted', data));
    this.socket.on('reactions-updated', (data) => this.emit('reactions-updated', data));
    this.socket.on('thread-update', (data) => this.emit('thread-update', data));
    this.socket.on('unread-update', (data) => this.emit('unread-update', data));

    // Presence events
    this.socket.on('user-status', (data) => this.emit('user-status', data));
    this.socket.on('online-users', (data) => this.emit('online-users', data));
    this.socket.on('user-typing', (data) => this.emit('user-typing', data));
    this.socket.on('channel-read', (data) => this.emit('channel-read', data));
  }

  joinChannel(channelId) {
    this.socket.emit('join-channel', channelId);
  }

  leaveChannel(channelId) {
    this.socket.emit('leave-channel', channelId);
  }

  sendMessage(data, callback) {
    this.socket.emit('send-message', data, callback);
  }

  editMessage(data, callback) {
    this.socket.emit('edit-message', data, callback);
  }

  deleteMessage(data, callback) {
    this.socket.emit('delete-message', data, callback);
  }

  addReaction(data, callback) {
    this.socket.emit('add-reaction', data, callback);
  }

  sendTyping(channelId) {
    this.socket.emit('typing', { channelId });
  }

  markRead(channelId) {
    this.socket.emit('mark-read', { channelId });
  }

  getUsers(callback) {
    this.socket.emit('get-users', callback);
  }

  // Simple event emitter
  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event, handler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  emit(event, data) {
    if (!this.handlers[event]) return;
    this.handlers[event].forEach(h => h(data));
  }
}

const socketClient = new SocketClient();
