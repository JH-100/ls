import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';

const COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C',
  '#E67E22', '#34495E', '#E91E63', '#00BCD4', '#FF5722', '#607D8B',
];

export default function ProfileEditModal({ onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.display_name || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.avatarColor || currentUser?.avatar_color || COLORS[0]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    try {
      await updateProfile(displayName.trim(), selectedColor);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal title="프로필 수정" onClose={onClose}>
      <div className="form-group">
        <label>표시 이름</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>
      <div className="form-group">
        <label>아바타 색상</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 8 }}>
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: c === selectedColor ? '3px solid #fff' : '3px solid transparent',
                background: c,
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          저장
        </button>
      </div>
    </Modal>
  );
}
