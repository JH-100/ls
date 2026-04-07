import { UploadIcon } from '../icons';

export default function DropOverlay() {
  return (
    <div className="drop-overlay" style={{ display: 'flex' }}>
      <div className="drop-overlay-inner">
        <UploadIcon size={40} />
        <p>파일을 놓아서 업로드</p>
      </div>
    </div>
  );
}
