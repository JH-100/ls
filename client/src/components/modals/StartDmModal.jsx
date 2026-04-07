import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import Modal from '../common/Modal';

export default function StartDmModal({ onClose }) {
  const { currentUser } = useAuth();
  const { allUsers, createDm, createGroup, selectChannel } = useChannels();
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');

  const otherUsers = useMemo(
    () => allUsers.filter(u => u.id !== currentUser?.id),
    [allUsers, currentUser?.id]
  );

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    try {
      let channel;
      if (selected.length === 1) {
        channel = await createDm(selected[0]);
      } else {
        channel = await createGroup(groupName.trim() || undefined, selected);
      }
      if (channel?.id) selectChannel(channel.id);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal title="대화 시작" onClose={onClose}>
      <div className="form-group">
        <label>사용자 선택 (1명=DM, 2명+=그룹)</label>
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {otherUsers.map(u => (
            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
              <span style={{ fontSize: 15 }}>{u.display_name} <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>@{u.username}</span></span>
            </label>
          ))}
        </div>
      </div>
      {selected.length >= 2 && (
        <div className="form-group">
          <label>그룹 이름 (선택)</label>
          <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="예: 프로젝트팀" />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          취소
        </button>
        <button onClick={handleSubmit} disabled={selected.length === 0} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: selected.length > 0 ? 'var(--accent)' : 'var(--bg-hover)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {selected.length <= 1 ? '대화 시작' : '그룹 만들기'}
        </button>
      </div>
    </Modal>
  );
}
