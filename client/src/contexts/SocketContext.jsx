import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ user, children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io({ autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const joinChannel = useCallback((channelId) => {
    socketRef.current?.emit('join-channel', channelId);
  }, []);

  const leaveChannel = useCallback((channelId) => {
    socketRef.current?.emit('leave-channel', channelId);
  }, []);

  const sendMessage = useCallback((data, callback) => {
    socketRef.current?.emit('send-message', data, callback);
  }, []);

  const editMessage = useCallback((data, callback) => {
    socketRef.current?.emit('edit-message', data, callback);
  }, []);

  const deleteMessage = useCallback((data, callback) => {
    socketRef.current?.emit('delete-message', data, callback);
  }, []);

  const addReaction = useCallback((data, callback) => {
    socketRef.current?.emit('add-reaction', data, callback);
  }, []);

  const sendTyping = useCallback((channelId) => {
    socketRef.current?.emit('typing', { channelId });
  }, []);

  const markRead = useCallback((data) => {
    socketRef.current?.emit('mark-read', data);
  }, []);

  const getUsers = useCallback((callback) => {
    socketRef.current?.emit('get-users', callback);
  }, []);

  // Helper: subscribe to a socket event (returns unsubscribe fn)
  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const value = {
    socket: socketRef.current,
    socketRef,
    connected,
    on,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    sendTyping,
    markRead,
    getUsers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
