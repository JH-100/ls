import { useState, useCallback } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { SendIcon } from '../icons';

export default function ThreadInput({ parentId }) {
  const [content, setContent] = useState('');
  const { sendMessage } = useMessages();

  const handleSend = useCallback(() => {
    const text = content.trim();
    if (!text) return;
    sendMessage(text, null, parentId);
    setContent('');
  }, [content, sendMessage, parentId]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="thread-input-area">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="답글을 입력하세요..."
        rows={1}
      />
      <button
        className="send-btn"
        onClick={handleSend}
        disabled={!content.trim()}
        title="전송"
      >
        <SendIcon size={18} />
      </button>
    </div>
  );
}
