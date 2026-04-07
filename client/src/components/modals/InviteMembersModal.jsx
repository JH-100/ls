import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import { apiCall } from '../../api';
import Modal from '../common/Modal';

export default function InviteMembersModal({ channelId, onClose }) {
  const { currentUser } = useAuth();
  const { allUsers, inviteToChannel, loadChannels } = useChannels();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    apiCall(`/api/channels/${channelId}/members`)
      .then(data => setMembers(data.map(m => m.id)))
      .catch(() => {});
  }, [channelId]);

  const nonMembers = useMemo(
    () => allUsers.filter(u => !members.includes(u.id) && u.id !== currentUser?.id),
    [allUsers, members, currentUser?.id]
  );

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleInvite = async () => {
    for (const userId of selected) {
      await inviteToChannel(channelId, userId).catch(() => {});
    }
    await loadChannels(true);
    onClose();
  };

  return (
    <Modal title="멤버 초대" onClose={onClose}>
      {nonMembers.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', padding: '8px 0' }}>초대할 수 있는 사용자가 없습니다 (모두 참가 중)</p>
      ) : (
        <div className="form-group">
          <label>초대할 사용자 선택</label>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {nonMembers.map(u => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer', borderRadius: 6 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
                <span style={{ fontSize: 15 }}>{u.display_name} <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>@{u.username}</span></span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          취소
        </button>
        <button
          onClick={handleInvite}
          disabled={selected.length === 0}
          style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: selected.length > 0 ? 'var(--accent)' : 'var(--bg-hover)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          초대
        </button>
      </div>
    </Modal>
  );
}
