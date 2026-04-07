import { FileIcon, XIcon } from '../icons';

export default function FilePreview({ file, onRemove }) {
  const name = file.originalName || file.name || '파일';
  const isImage = file.isImage || file.mimeType?.startsWith('image/') || file.type?.startsWith('image/');

  return (
    <div className="file-preview">
      {isImage && file.url ? (
        <img src={file.url} alt={name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <FileIcon size={16} />
      )}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <button className="icon-btn" onClick={onRemove} title="제거">
        <XIcon size={14} />
      </button>
    </div>
  );
}
