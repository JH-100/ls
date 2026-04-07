import { FileIcon, XIcon } from '../icons';

export default function FilePreview({ file, onRemove }) {
  return (
    <div className="file-preview">
      <FileIcon size={16} />
      <span className="file-preview-name">{file.name}</span>
      <button className="icon-btn" onClick={onRemove} title="제거">
        <XIcon size={14} />
      </button>
    </div>
  );
}
