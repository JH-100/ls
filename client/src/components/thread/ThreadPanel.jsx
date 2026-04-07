import { useEffect, useRef } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import { XIcon } from '../icons';
import MessageItem from '../chat/MessageItem';
import ThreadInput from './ThreadInput';

export default function ThreadPanel() {
  const { threadMessages, activeThreadId, loadThread, closeThread } = useMessages();
  const { currentUser } = useAuth();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (activeThreadId) {
      loadThread(activeThreadId);
    }
  }, [activeThreadId, loadThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages]);

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <h3>스레드</h3>
        <button className="icon-btn" onClick={closeThread}>
          <XIcon size={18} />
        </button>
      </div>
      <div className="thread-messages" ref={scrollRef}>
        {threadMessages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} currentUserId={currentUser?.id} />
        ))}
      </div>
      <ThreadInput parentId={activeThreadId} />
    </div>
  );
}
