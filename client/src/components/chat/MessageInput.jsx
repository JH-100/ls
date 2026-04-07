import { useState, useRef, useCallback, useEffect } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { useSocket } from '../../contexts/SocketContext';
import { useChannels } from '../../contexts/ChannelContext';
import { debounce } from '../../utils/debounce';
import { PaperclipIcon, SmileIcon, SendIcon } from '../icons';
import { EMOJI_LIST } from '../../data/emojis';
import EmojiPicker from '../reactions/EmojiPicker';
import FilePreview from './FilePreview';
import DropOverlay from './DropOverlay';

export default function MessageInput() {
  const [content, setContent] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { sendMessage } = useMessages();
  const socket = useSocket();
  const { currentChannel } = useChannels();

  const emitTyping = useCallback(
    debounce(() => {
      if (currentChannel) {
        socket.emitTyping(currentChannel.id);
      }
    }, 1000),
    [socket, currentChannel]
  );

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = content.trim();
    if (!text && !pendingFile) return;

    sendMessage(text, pendingFile);
    setContent('');
    setPendingFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, pendingFile, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e) => {
      setContent(e.target.value);
      emitTyping();
      autoResize();
    },
    [emitTyping, autoResize]
  );

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
    e.target.value = '';
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, []);

  // Drag & drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPendingFile(file);
    }
  }, []);

  return (
    <div
      className="message-input-container"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && <DropOverlay />}

      {pendingFile && (
        <FilePreview file={pendingFile} onRemove={() => setPendingFile(null)} />
      )}

      <div className="message-input-row">
        <button
          className="icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="파일 첨부"
        >
          <PaperclipIcon size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          className="message-input"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
        />
        <button
          className="icon-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="이모지"
        >
          <SmileIcon size={18} />
        </button>
        <button
          className="icon-btn send-btn"
          onClick={handleSend}
          title="전송"
          disabled={!content.trim() && !pendingFile}
        >
          <SendIcon size={18} />
        </button>
      </div>

      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}
    </div>
  );
}
