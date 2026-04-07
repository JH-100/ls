import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '../api.js';
import { useSocket } from './SocketContext.jsx';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [threadMessages, setThreadMessages] = useState([]);
  const [lastReadAt, setLastReadAt] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const { socketRef, connected } = useSocket();
  const activeChannelRef = useRef(null);

  const loadMessages = useCallback(async (channelId) => {
    activeChannelRef.current = channelId;
    // Clear immediately so UI doesn't show stale messages
    setMessages([]);
    setLastReadAt(null);
    try {
      const data = await apiCall(`/api/messages/${channelId}`);
      if (activeChannelRef.current === channelId) {
        setMessages(data.messages || data || []);
        setLastReadAt(data.lastReadAt || null);
      }
      return data;
    } catch (err) {
      console.error('Failed to load messages:', err);
      return { messages: [], lastReadAt: null };
    }
  }, []);

  const loadThread = useCallback(async (channelId, parentId) => {
    try {
      const data = await apiCall(`/api/messages/${channelId}/thread/${parentId}`);
      setThreadMessages(data.messages || data || []);
      return data;
    } catch (err) {
      console.error('Failed to load thread:', err);
      return [];
    }
  }, []);

  const openThread = useCallback((parentId) => {
    setActiveThreadId(parentId);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThreadId(null);
    setThreadMessages([]);
  }, []);

  const searchMessages = useCallback(async (query) => {
    try {
      const data = await apiCall(`/api/messages/search/query?q=${encodeURIComponent(query)}`);
      setSearchResults(data.messages || data || []);
      return data;
    } catch (err) {
      console.error('Failed to search messages:', err);
      setSearchResults([]);
      return [];
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const currentChannel = activeChannelRef.current;
      if (msg.channel_id === currentChannel && !msg.parent_id) {
        setMessages((prev) => [...prev, msg]);
      }
      if (msg.parent_id && msg.parent_id === activeThreadId) {
        setThreadMessages((prev) => [...prev, msg]);
      }
    };

    const handleMessageEdited = (data) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, content: data.content, edited: 1 } : m))
      );
      setThreadMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, content: data.content, edited: 1 } : m))
      );
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
      setThreadMessages((prev) => prev.filter((m) => m.id !== data.id));
    };

    const handleReactionsUpdated = (data) => {
      const updateReactions = (msgs) =>
        msgs.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
      setMessages(updateReactions);
      setThreadMessages(updateReactions);
    };

    const handleThreadUpdate = (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.parentId
            ? { ...m, reply_count: data.replyCount, last_reply_at: data.lastReplyAt }
            : m
        )
      );
    };

    const handleChannelRead = (data) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === data.messageId || (data.channelId && m.channel_id === data.channelId)) {
            return { ...m, readCount: (m.readCount || 0) + 1 };
          }
          return m;
        })
      );
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('reactions-updated', handleReactionsUpdated);
    socket.on('thread-update', handleThreadUpdate);
    socket.on('channel-read', handleChannelRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('reactions-updated', handleReactionsUpdated);
      socket.off('thread-update', handleThreadUpdate);
      socket.off('channel-read', handleChannelRead);
    };
  }, [connected, activeThreadId]);

  const value = {
    messages,
    threadMessages,
    lastReadAt,
    activeThreadId,
    searchResults,
    loadMessages,
    loadThread,
    openThread,
    closeThread,
    searchMessages,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}
