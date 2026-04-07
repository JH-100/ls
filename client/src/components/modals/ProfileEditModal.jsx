import { useState } from 'react';
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
  const [status, setStatus] = useState('idle'); // idle | uploading | saving | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');
      setAvatarUrl(data.avatarUrl);
      setStatus('idle');
    } catch (err) {
      setErrorMsg('이미지 업로드 실패: ' + err.message);
      setStatus('error');
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setStatus('saving');
    setErrorMsg('');
    try {
      const body = { displayName: displayName.trim(), avatarColor: selectedColor };
      if (avatarUrl === null && (currentUser?.avatarUrl || currentUser?.avatar_url)) {
        body.avatarUrl = null;
      }
      await updateProfile(body.displayName, body.avatarColor, body.avatarUrl);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const initial = (displayName || '?').charAt(0).toUpperCase();
  const isUploading = status === 'uploading';
  const isSaving = status === 'saving';
  const isBusy = isUploading || isSaving;

  return (
    <Modal title="프로필 수정" onClose={onClose}>
      {errorMsg && <div className="error-message" style={{ marginBottom: 12 }}>{errorMsg}</div>}

      <div className="form-group">
        <label>표시 이름</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>

      <div className="form-group">
        <label>아바타</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          {/* Preview */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, overflow: 'hidden', position: 'relative',
            background: avatarUrl ? '#222' : selectedColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 26, flexShrink: 0,
          }}>
            {avatarUrl
              ? <img src={avatarUrl + '?v=' + Date.now()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initial
            }
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
              </div>
            )}
          </div>

          {/* Upload button — uses <label> wrapping <input> for guaranteed browser compatibility */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid var(--border-color)',
              background: isUploading ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: isUploading ? '#fff' : 'var(--text-primary)',
              cursor: isBusy ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {isUploading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {isUploading ? '업로드 중...' : '이미지 변경'}
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={isBusy}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} />
            </label>
            {avatarUrl && !isBusy && (
              <button type="button" onClick={() => { setAvatarUrl(null); setErrorMsg(''); }}
                style={{ padding: '4px 16px', borderRadius: 6, border: 'none', background: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: 12, textAlign: 'left' }}>
                이미지 제거
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Color picker — only when no image */}
      {!avatarUrl && (
        <div className="form-group">
          <label>아바타 색상</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setSelectedColor(c)}
                style={{ width: 36, height: 36, borderRadius: 8, background: c, cursor: 'pointer',
                  border: c === selectedColor ? '3px solid #fff' : '3px solid transparent' }} />
            ))}
            <label style={{
              width: 36, height: 36, borderRadius: 8, position: 'relative', overflow: 'hidden',
              border: !PRESET_COLORS.includes(selectedColor) ? '3px solid #fff' : '1px dashed var(--text-secondary)',
              background: !PRESET_COLORS.includes(selectedColor) ? selectedColor : 'var(--bg-tertiary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }} title="커스텀 색상">
              <PlusIcon size={14} />
              <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button type="button" onClick={onClose} disabled={isBusy}
          style={{ flex: 1, padding: 10, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          취소
        </button>
        <button type="button" onClick={handleSave} disabled={isBusy}
          style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: isBusy ? 'var(--bg-hover)' : 'var(--accent)', color: '#fff', cursor: isBusy ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600 }}>
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </Modal>
  );
}
