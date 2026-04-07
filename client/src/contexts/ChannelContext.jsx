import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiCall } from '../api.js';
import { useSocket } from './SocketContext.jsx';

const ChannelContext = createContext(null);

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const { socketRef, joinChannel, getUsers } = useSocket();

  const loadChannels = useCallback(async (keepActive = true) => {
    try {
      const data = await apiCall('/api/channels');
      const channelList = data.channels || data;

      setChannels(channelList);

      if (!keepActive && channelList.length > 0) {
        setActiveChannelId(channelList[0].id);
      }

      // Join all channel rooms
      channelList.forEach((ch) => joinChannel(ch.id));

      // Load all users
      getUsers((users) => {
        if (users) setAllUsers(users);
      });
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  }, [joinChannel, getUsers]);

  const selectChannel = useCallback((id) => {
    setActiveChannelId(id);
  }, []);

  const createChannel = useCallback(async (name, description) => {
    const data = await apiCall('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    await loadChannels();
    return data;
  }, [loadChannels]);

  const createDm = useCallback(async (userId) => {
    const data = await apiCall('/api/channels/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await loadChannels();
    return data;
  }, [loadChannels]);

  const createGroup = useCallback(async (name, userIds) => {
    const data = await apiCall('/api/channels/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userIds }),
    });
    await loadChannels();
    return data;
  }, [loadChannels]);

  const inviteToChannel = useCallback(async (channelId, userId) => {
    const data = await apiCall(`/api/channels/${channelId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await loadChannels();
    return data;
  }, [loadChannels]);

  // Force active channel unread_count to 0
  useEffect(() => {
    if (activeChannelId) {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === activeChannelId ? { ...ch, unread_count: 0 } : ch
        )
      );
    }
  }, [activeChannelId]);

  // Listen for unread-update and channel-read socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleUnreadUpdate = () => {
      loadChannels();
    };

    const handleChannelRead = () => {
      loadChannels();
    };

    socket.on('unread-update', handleUnreadUpdate);
    socket.on('channel-read', handleChannelRead);

    return () => {
      socket.off('unread-update', handleUnreadUpdate);
      socket.off('channel-read', handleChannelRead);
    };
  }, [socketRef, loadChannels]);

  const value = {
    channels,
    activeChannelId,
    allUsers,
    loadChannels,
    selectChannel,
    createChannel,
    createDm,
    createGroup,
    inviteToChannel,
  };

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannels() {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
}
