import { useState, useCallback, useEffect, useRef } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatTime } from '../../utils/formatTime';
import { formatMessageContent } from '../../utils/formatMessage';
import Avatar from '../common/Avatar';
import ReadReceipt from './ReadReceipt';
import ReactionList from '../reactions/ReactionList';
import { SmileIcon, MessageSquareIcon, EditIcon, TrashIcon, FileIcon, PlusIcon } from '../icons';
import { REACTION_EMOJIS, EMOJI_LIST } from '../../data/emojis';

export default function MessageItem({ msg, currentUserId }) {
  const { openThread } = useMessages();
  const { editMessage, deleteMessage, addReaction } = useSocket();
  const [picker, setPicker] = useState(null); // null | 'quick' | 'full'
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const pickerRef = useRef(null);

  const isOwn = msg.user_id === currentUserId;

  // Close picker on outside click
  useEffect(() => {
    if (!picker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPicker(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [picker]);

  const handleReaction = useCallback((emoji) => {
    addReaction({ messageId: msg.id, emoji });
    setPicker(null);
  }, [addReaction, msg.id]);

  const handleEdit = () => { setEditContent(msg.content); setIsEditing(true); };

  const handleEditSave = () => {
    if (editContent.trim()) editMessage({ messageId: msg.id, content: editContent.trim() });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('메시지를 삭제하시겠습니까?')) deleteMessage({ messageId: msg.id });
  };

  return (
    <div className="message" data-message-id={msg.id}>
      <Avatar name={msg.display_name} color={msg.avatar_color} size={38} />
      <div className="message-body">
        <div className="message-header">
          <span className="message-author">{msg.display_name}</span>
          <span className="message-time">{formatTime(msg.created_at)}</span>
          {msg.edited === 1 && <span className="message-edited">(수정됨)</span>}
          {isOwn && msg.totalMembers > 0 && (
            <ReadReceipt readCount={msg.readCount || 0} totalMembers={msg.totalMembers} />
          )}
        </div>

        {isEditing ? (
          <div className="message-edit">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleEditSave(); }
                if (e.key === 'Escape') setIsEditing(false);
              }}
              autoFocus
            />
            <div className="message-edit-actions">
              <button className="btn" onClick={() => setIsEditing(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleEditSave}>저장</button>
            </div>
          </div>
        ) : (
          <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content || '') }} />
        )}

        {msg.file_url && (
          <div className="message-file">
            {msg.file_type?.startsWith('image/') ? (
              <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                <img src={msg.file_url} alt={msg.file_name || 'image'} loading="lazy" />
              </a>
            ) : (
              <a className="file-info" href={msg.file_url} target="_blank" rel="noopener noreferrer">
                <FileIcon size={16} /> {msg.file_name || '파일 다운로드'}
              </a>
            )}
          </div>
        )}

        <ReactionList reactions={msg.reactions} messageId={msg.id} currentUserId={currentUserId} />

        {msg.reply_count > 0 && (
          <button className="thread-link" onClick={() => openThread(msg.id)}>
            {msg.reply_count}개의 답글
          </button>
        )}

        {/* Hover action bar */}
        <div className="message-actions">
          <button onClick={() => setPicker(p => p ? null : 'quick')} title="반응"><SmileIcon size={16} /></button>
          <button onClick={() => openThread(msg.id)} title="스레드"><MessageSquareIcon size={16} /></button>
          {isOwn && (
            <>
              <button onClick={handleEdit} title="수정"><EditIcon size={16} /></button>
              <button onClick={handleDelete} title="삭제"><TrashIcon size={16} /></button>
            </>
          )}
        </div>

        {/* Reaction picker */}
        {picker && (
          <div ref={pickerRef} style={{
            position: 'absolute', bottom: '100%', right: 8, zIndex: 50,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {picker === 'quick' && (
              <div style={{ display: 'flex', gap: 2, padding: 6, alignItems: 'center' }}>
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    style={{
                      fontSize: 24, padding: '4px 2px', border: 'none', background: 'none',
                      cursor: 'pointer', borderRadius: 6, lineHeight: 1, transition: 'background 0.1s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setPicker('full')}
                  style={{
                    width: 32, height: 32, border: '1px solid var(--border-color)', borderRadius: 6,
                    background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                    marginLeft: 2,
                  }}
                  title="더 많은 이모지"
                >
                  <PlusIcon size={14} />
                </button>
              </div>
            )}
            {picker === 'full' && (
              <div style={{ width: 340, maxHeight: 300, overflowY: 'auto', padding: 10 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2,
                }}>
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      style={{
                        fontSize: 24, padding: 5, border: 'none', background: 'none',
                        cursor: 'pointer', borderRadius: 6, transition: 'background 0.1s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
