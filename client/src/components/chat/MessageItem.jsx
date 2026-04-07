import { useState, useCallback } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatTime } from '../../utils/formatTime';
import { formatMessageContent } from '../../utils/formatMessage';
import Avatar from '../common/Avatar';
import ReadReceipt from './ReadReceipt';
import ReactionList from '../reactions/ReactionList';
import EmojiPicker from '../reactions/EmojiPicker';
import { SmileIcon, MessageSquareIcon, EditIcon, TrashIcon, FileIcon } from '../icons';

export default function MessageItem({ msg, currentUserId }) {
  const { openThread, editMessage, deleteMessage } = useMessages();
  const socket = useSocket();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isOwn = msg.user_id === currentUserId;
  const isImage = msg.file_url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(msg.file_url);

  const handleReaction = useCallback(
    (emoji) => {
      socket.addReaction(msg.id, emoji);
      setShowEmojiPicker(false);
    },
    [socket, msg.id]
  );

  const handleEdit = useCallback(() => {
    setEditContent(msg.content);
    setIsEditing(true);
  }, [msg.content]);

  const handleEditSubmit = useCallback(() => {
    if (editContent.trim()) {
      editMessage(msg.id, editContent.trim());
    }
    setIsEditing(false);
  }, [editMessage, msg.id, editContent]);

  const handleEditKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleEditSubmit();
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [handleEditSubmit]
  );

  const handleDelete = useCallback(() => {
    if (window.confirm('메시지를 삭제하시겠습니까?')) {
      deleteMessage(msg.id);
    }
  }, [deleteMessage, msg.id]);

  return (
    <div className="message" data-message-id={msg.id}>
      <Avatar name={msg.display_name} color={msg.avatar_color} size={38} />
      <div className="message-body">
        <div className="message-header">
          <span className="message-author">{msg.display_name}</span>
          <span className="message-time">{formatTime(msg.created_at)}</span>
          {msg.updated_at && msg.updated_at !== msg.created_at && (
            <span className="message-edited">(수정됨)</span>
          )}
          {isOwn && (
            <ReadReceipt readCount={msg.read_count} totalMembers={msg.total_members} />
          )}
        </div>

        {isEditing ? (
          <div className="message-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
            />
            <div className="message-edit-actions">
              <button className="btn btn-sm" onClick={() => setIsEditing(false)}>
                취소
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleEditSubmit}>
                저장
              </button>
            </div>
          </div>
        ) : (
          <div
            className="message-content"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
          />
        )}

        {msg.file_url && (
          <div className="message-file">
            {isImage ? (
              <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                <img
                  className="message-image"
                  src={msg.file_url}
                  alt={msg.file_name || 'image'}
                />
              </a>
            ) : (
              <a
                className="file-link"
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileIcon size={16} />
                <span>{msg.file_name || '파일'}</span>
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

        <div className="message-actions">
          <button
            className="icon-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="반응"
          >
            <SmileIcon size={16} />
          </button>
          <button className="icon-btn" onClick={() => openThread(msg.id)} title="스레드">
            <MessageSquareIcon size={16} />
          </button>
          {isOwn && (
            <>
              <button className="icon-btn" onClick={handleEdit} title="수정">
                <EditIcon size={16} />
              </button>
              <button className="icon-btn" onClick={handleDelete} title="삭제">
                <TrashIcon size={16} />
              </button>
            </>
          )}
        </div>

        {showEmojiPicker && (
          <EmojiPicker
            onSelect={handleReaction}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
