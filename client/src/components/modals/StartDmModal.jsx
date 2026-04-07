import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import Modal from '../common/Modal';

export default function StartDmModal({ onClose }) {
  const { currentUser } = useAuth();
  const { allUsers, createDm, createGroup } = useChannels();
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const otherUsers = useMemo(
    () => allUsers.filter((u) => u.id !== currentUser?.id),
    [allUsers, currentUser?.id]
  );

  const toggleUser = useCallback((userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (selected.length === 0) {
        setError('사용자를 선택하세요');
        return;
      }
      try {
        if (selected.length === 1) {
          await createDm(selected[0]);
        } else {
          await createGroup(selected, groupName.trim() || undefined);
        }
        onClose();
      } catch (err) {
        setError(err.message || '실패했습니다');
      }
    },
    [selected, groupName, createDm, createGroup, onClose]
  );

  return (
    <Modal title="새 메시지" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group user-checkbox-list">
          {otherUsers.map((user) => (
            <label key={user.id} className="checkbox-item">
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => toggleUser(user.id)}
              />
              <span>{user.display_name}</span>
            </label>
          ))}
        </div>
        {selected.length >= 2 && (
          <div className="form-group">
            <label htmlFor="group-name">그룹 이름 (선택)</label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="그룹 이름"
            />
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary">
            {selected.length <= 1 ? '메시지 보내기' : '그룹 만들기'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
