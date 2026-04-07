import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';
import { PlusIcon } from '../icons';

const PRESET_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C',
  '#E67E22', '#34495E', '#E91E63', '#00BCD4', '#FF5722', '#607D8B',
];

export default function ProfileEditModal({ onClose }) {
  const { currentUser, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.display_name || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.avatarColor || currentUser?.avatar_color || PRESET_COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || currentUser?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvatarUrl(data.avatarUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(displayName.trim(), selectedColor, avatarUrl);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <Modal title="프로필 수정" onClose={onClose}>
      <div className="form-group">
        <label>표시 이름</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>

      {/* Avatar preview */}
      <div className="form-group">
        <label>아바타</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
            background: avatarUrl ? 'none' : selectedColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 26, flexShrink: 0,
            position: 'relative',
          }}>
            {avatarUrl ? (
              <img src={avatarUrl + '?t=' + Date.now()} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initial}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)',
                background: uploading ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: uploading ? '#fff' : 'var(--text-primary)',
                cursor: uploading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {uploading && <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {uploading ? '업로드 중...' : '이미지 업로드'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  padding: '4px 14px', borderRadius: 6, border: 'none',
                  background: 'none', color: 'var(--danger)',
                  cursor: 'pointer', fontSize: 12,
                }}
              >
                이미지 제거
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </div>
      </div>

      {/* Color picker (only when no image) */}
      {!avatarUrl && (
        <div className="form-group">
          <label>아바타 색상</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: c === selectedColor ? '3px solid #fff' : '3px solid transparent',
                  background: c, cursor: 'pointer',
                }}
              />
            ))}
            <label
              style={{
                width: 36, height: 36, borderRadius: 8, position: 'relative',
                border: !PRESET_COLORS.includes(selectedColor) ? '3px solid #fff' : '1px dashed var(--text-secondary)',
                background: !PRESET_COLORS.includes(selectedColor) ? selectedColor : 'var(--bg-tertiary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', overflow: 'hidden',
              }}
              title="커스텀 색상"
            >
              <PlusIcon size={14} />
              <input
                type="color"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          취소
        </button>
        <button type="button" onClick={handleSave} disabled={saving || uploading} style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (saving || uploading) ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </Modal>
  );
}
