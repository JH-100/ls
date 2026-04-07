import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import { apiCall } from '../../api';
import Modal from '../common/Modal';

export default function InviteMembersModal({ channelId, onClose }) {
  const { currentUser } = useAuth();
  const { allUsers, inviteToChannel } = useChannels();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await apiCall(`/api/channels/${channelId}/members`);
        setMembers(data.map((m) => m.id));
      } catch {
        setMembers([]);
      }
    };
    fetchMembers();
  }, [channelId]);

  const nonMembers = useMemo(
    () => allUsers.filter((u) => !members.includes(u.id) && u.id !== currentUser?.id),
    [allUsers, members, currentUser?.id]
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
        setError('초대할 사용자를 선택하세요');
        return;
      }
      try {
        for (const userId of selected) {
          await inviteToChannel(channelId, userId);
        }
        onClose();
      } catch (err) {
        setError(err.message || '초대에 실패했습니다');
      }
    },
    [selected, channelId, inviteToChannel, onClose]
  );

  return (
    <Modal title="멤버 초대" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        {nonMembers.length === 0 ? (
          <p>초대할 수 있는 사용자가 없습니다</p>
        ) : (
          <div className="form-group user-checkbox-list">
            {nonMembers.map((user) => (
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
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={selected.length === 0}
          >
            초대
          </button>
        </div>
      </form>
    </Modal>
  );
}
