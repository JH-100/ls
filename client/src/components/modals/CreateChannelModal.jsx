import { useState, useCallback } from 'react';
import { useChannels } from '../../contexts/ChannelContext';
import Modal from '../common/Modal';

export default function CreateChannelModal({ onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const { createChannel } = useChannels();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!name.trim()) {
        setError('채널 이름을 입력하세요');
        return;
      }
      try {
        await createChannel(name.trim(), description.trim());
        onClose();
      } catch (err) {
        setError(err.message || '채널 생성에 실패했습니다');
      }
    },
    [name, description, createChannel, onClose]
  );

  return (
    <Modal title="채널 만들기" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="channel-name">채널 이름</label>
          <input
            id="channel-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 채널 이름"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="channel-desc">설명 (선택)</label>
          <input
            id="channel-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="채널 설명"
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary">
            만들기
          </button>
        </div>
      </form>
    </Modal>
  );
}
