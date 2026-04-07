import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ user, children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io({ autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinChannel = useCallback((channelId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-channel', channelId);
    }
  }, []);

  const leaveChannel = useCallback((channelId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-channel', channelId);
    }
  }, []);

  const sendMessage = useCallback((data, callback) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', data, callback);
    }
  }, []);

  const editMessage = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('edit-message', data);
    }
  }, []);

  const deleteMessage = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('delete-message', data);
    }
  }, []);

  const addReaction = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('add-reaction', data);
    }
  }, []);

  const sendTyping = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', data);
    }
  }, []);

  const markRead = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit('mark-read', data);
    }
  }, []);

  const getUsers = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.emit('get-users', callback);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    socketRef,
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
