import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useChannels } from '../../contexts/ChannelContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TypingIndicator() {
  const [typers, setTypers] = useState({});
  const socket = useSocket();
  const { currentChannel } = useChannels();
  const { currentUser } = useAuth();
  const timersRef = useRef({});

  const handleTyping = useCallback(
    ({ userId, userName, channelId }) => {
      if (channelId !== currentChannel?.id) return;
      if (userId === currentUser?.id) return;

      setTypers((prev) => ({ ...prev, [userId]: userName }));

      // Clear previous timer
      if (timersRef.current[userId]) {
        clearTimeout(timersRef.current[userId]);
      }

      timersRef.current[userId] = setTimeout(() => {
        setTypers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        delete timersRef.current[userId];
      }, 3000);
    },
    [currentChannel?.id, currentUser?.id]
  );

  useEffect(() => {
    if (!socket) return;
    socket.on('user-typing', handleTyping);
    return () => {
      socket.off('user-typing', handleTyping);
    };
  }, [socket, handleTyping]);

  // Clear typers when channel changes
  useEffect(() => {
    setTypers({});
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
  }, [currentChannel?.id]);

  const names = Object.values(typers);
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]}님이 입력 중...`
      : `${names.join(', ')}님이 입력 중...`;

  return <div className="typing-indicator">{text}</div>;
}
