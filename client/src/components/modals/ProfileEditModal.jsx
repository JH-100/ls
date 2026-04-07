import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';

const COLORS = [
  '#E74C3C',
  '#3498DB',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#34495E',
  '#E91E63',
  '#00BCD4',
  '#FF5722',
  '#607D8B',
];

export default function ProfileEditModal({ onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.avatar_color || COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!displayName.trim()) {
        setError('표시 이름을 입력하세요');
        return;
      }
      try {
        await updateProfile(displayName.trim(), selectedColor);
        onClose();
      } catch (err) {
        setError(err.message || '프로필 수정에 실패했습니다');
      }
    },
    [displayName, selectedColor, updateProfile, onClose]
  );

  return (
    <Modal title="프로필 수정" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="display-name">표시 이름</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="표시 이름"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>아바타 색상</label>
          <div className="color-grid">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
