import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TypingIndicator({ channelId }) {
  const [typers, setTypers] = useState({});
  const { socketRef, connected } = useSocket();
  const { currentUser } = useAuth();
  const timersRef = useRef({});

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (data) => {
      if (data.channelId !== channelId) return;
      if (data.userId === currentUser?.id) return;

      setTypers(prev => ({ ...prev, [data.userId]: data.displayName }));

      if (timersRef.current[data.userId]) clearTimeout(timersRef.current[data.userId]);
      timersRef.current[data.userId] = setTimeout(() => {
        setTypers(prev => {
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
      }, 3000);
    };

    socket.on('user-typing', handler);
    return () => socket.off('user-typing', handler);
  }, [connected, channelId, currentUser?.id]);

  // Clear on channel change
  useEffect(() => {
    setTypers({});
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
  }, [channelId]);

  const names = Object.values(typers);
  if (names.length === 0) return <div className="typing-indicator" style={{ visibility: 'hidden' }}>&nbsp;</div>;

  return (
    <div className="typing-indicator">
      {names.join(', ')}님이 입력 중...
    </div>
  );
}
