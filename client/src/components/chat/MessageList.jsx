import { useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessageContext';
import { useChannels } from '../../contexts/ChannelContext';
import { formatDate } from '../../utils/formatDate';
import MessageItem from './MessageItem';
import DateDivider from './DateDivider';
import NewMessageDivider from './NewMessageDivider';

export default function MessageList() {
  const { currentUser } = useAuth();
  const { messages } = useMessages();
  const { currentChannel } = useChannels();
  const containerRef = useRef(null);
  const newMsgRef = useRef(null);

  const lastReadAt = currentChannel?.last_read_at;

  const items = useMemo(() => {
    const result = [];
    let prevDate = null;
    let newMsgInserted = false;

    for (const msg of messages) {
      const msgDate = formatDate(msg.created_at);

      if (msgDate !== prevDate) {
        result.push({ type: 'date', date: msgDate, key: `date-${msgDate}` });
        prevDate = msgDate;
      }

      if (
        !newMsgInserted &&
        lastReadAt &&
        msg.created_at > lastReadAt &&
        msg.user_id !== currentUser?.id
      ) {
        result.push({ type: 'new', key: 'new-msg-divider' });
        newMsgInserted = true;
      }

      result.push({ type: 'message', msg, key: `msg-${msg.id}` });
    }

    return result;
  }, [messages, lastReadAt, currentUser?.id]);

  useEffect(() => {
    if (newMsgRef.current) {
      newMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

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
          <MessageItem
            key={item.key}
            msg={item.msg}
            currentUserId={currentUser?.id}
          />
        );
      })}
      </div>
    </div>
  );
}
