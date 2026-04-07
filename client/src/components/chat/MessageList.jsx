import { useEffect, useRef, useMemo } from 'react';
import { formatDate } from '../../utils/formatDate';
import MessageItem from './MessageItem';
import DateDivider from './DateDivider';
import NewMessageDivider from './NewMessageDivider';

export default function MessageList({ messages, currentUserId, lastReadAt }) {
  const containerRef = useRef(null);
  const newMsgRef = useRef(null);

  const items = useMemo(() => {
    const result = [];
    let prevDate = null;
    let newMsgInserted = false;

    const hasUnread = lastReadAt && messages.some(
      m => m.created_at > lastReadAt && m.user_id !== currentUserId
    );

    for (const msg of messages) {
      const msgDate = formatDate(msg.created_at);

      if (msgDate !== prevDate) {
        result.push({ type: 'date', date: msgDate, key: `date-${msgDate}` });
        prevDate = msgDate;
      }

      // Insert new message divider before first unread message from others
      if (hasUnread && !newMsgInserted && msg.created_at > lastReadAt && msg.user_id !== currentUserId) {
        result.push({ type: 'new', key: 'new-msg-divider' });
        newMsgInserted = true;
      }

      result.push({ type: 'message', msg, key: `msg-${msg.id}` });
    }

    return result;
  }, [messages, lastReadAt, currentUserId]);

  // Scroll to new message divider or bottom
  useEffect(() => {
    if (!containerRef.current) return;
    if (newMsgRef.current) {
      newMsgRef.current.scrollIntoView({ block: 'center' });
    } else if (messages.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    } else {
      containerRef.current.scrollTop = 0;
    }
  }, [items, messages.length]);

  return (
    <div className="messages-container" ref={containerRef}>
      <div className="messages-list">
        {items.map((item) => {
          if (item.type === 'date') {
            return <DateDivider key={item.key} date={item.date} />;
          }
          if (item.type === 'new') {
            return <NewMessageDivider key={item.key} ref={newMsgRef} />;
          }
          return (
            <MessageItem key={item.key} msg={item.msg} currentUserId={currentUserId} />
          );
        })}
      </div>
    </div>
  );
}
