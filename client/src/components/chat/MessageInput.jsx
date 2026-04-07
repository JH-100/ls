import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { debounce } from '../../utils/debounce';
import { PaperclipIcon, SmileIcon, SendIcon } from '../icons';
import EmojiPicker from '../reactions/EmojiPicker';
import FilePreview from './FilePreview';
import DropOverlay from './DropOverlay';

export default function MessageInput({ channelId }) {
  const [content, setContent] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  const { sendMessage, sendTyping } = useSocket();

  // Reset on channel change
  useEffect(() => {
    setContent('');
    setPendingFile(null);
    setShowEmoji(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [channelId]);

  const emitTyping = useCallback(
    debounce(() => {
      if (channelId) sendTyping(channelId);
    }, 1000),
    [channelId, sendTyping]
  );

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text && !pendingFile) return;
    if (!channelId) return;

    const msgData = { channelId, content: text };

    if (pendingFile) {
      // Already uploaded (has url) vs raw File object
      if (pendingFile.url) {
        msgData.fileUrl = pendingFile.url;
        msgData.fileName = pendingFile.originalName;
        msgData.fileType = pendingFile.mimeType;
      } else {
        try {
          const uploaded = await uploadFile(pendingFile);
          msgData.fileUrl = uploaded.url;
          msgData.fileName = uploaded.originalName;
          msgData.fileType = uploaded.mimeType;
        } catch (err) {
          alert(err.message);
          return;
        }
      }
    }

    sendMessage(msgData, (res) => {
      if (res?.error) console.error(res.error);
    });

    setContent('');
    setPendingFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [content, pendingFile, channelId, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        try {
          const uploaded = await uploadFile(file);
          setPendingFile(uploaded);
        } catch (err) {
          alert(err.message);
        }
        return;
      }
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    emitTyping();
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
  };

  const handleFileDrop = async (file) => {
    try {
      const uploaded = await uploadFile(file);
      setPendingFile(uploaded);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const uploaded = await uploadFile(file);
      setPendingFile(uploaded);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      className="message-input-area"
      onDragEnter={(e) => { e.preventDefault(); dragCounterRef.current++; setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); dragCounterRef.current = 0; setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop(f); }}
    >
      {isDragging && <DropOverlay />}

      {pendingFile && (
        <FilePreview file={pendingFile} onRemove={() => setPendingFile(null)} />
      )}

      <div className="input-row">
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="파일 첨부">
          <PaperclipIcon size={20} />
        </button>
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileInput} />
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="메시지를 입력하세요..."
          rows={1}
        />
        <button className="icon-btn" onClick={() => setShowEmoji(s => !s)} title="이모지">
          <SmileIcon size={20} />
        </button>
        <button className="send-btn" onClick={handleSend} title="전송">
          <SendIcon size={18} />
        </button>
      </div>

      {showEmoji && <EmojiPicker onSelect={(e) => { setContent(c => c + e); setShowEmoji(false); textareaRef.current?.focus(); }} onClose={() => setShowEmoji(false)} />}
    </div>
  );
}
