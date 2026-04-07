import { useMemo, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';

export default function ReactionList({ reactions, messageId, currentUserId }) {
  const socket = useSocket();

  const grouped = useMemo(() => {
    if (!reactions || reactions.length === 0) return [];

    const map = {};
    for (const r of reactions) {
      if (!map[r.emoji]) {
        map[r.emoji] = { emoji: r.emoji, count: 0, users: [], mine: false };
      }
      map[r.emoji].count++;
      map[r.emoji].users.push(r.user_id);
      if (r.user_id === currentUserId) {
        map[r.emoji].mine = true;
      }
    }
    return Object.values(map);
  }, [reactions, currentUserId]);

  const handleToggle = useCallback(
    (emoji) => {
      socket.addReaction(messageId, emoji);
    },
    [socket, messageId]
  );

  if (grouped.length === 0) return null;

  return (
    <div className="message-reactions">
      {grouped.map((r) => (
        <button
          key={r.emoji}
          className={`reaction ${r.mine ? 'mine' : ''}`}
          onClick={() => handleToggle(r.emoji)}
        >
          <span className="emoji">{r.emoji}</span>
          <span className="count">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
