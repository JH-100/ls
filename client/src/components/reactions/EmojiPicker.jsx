import { useEffect, useRef } from 'react';
import { EMOJI_LIST } from '../../data/emojis';

export default function EmojiPicker({ onSelect, onClose }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="emoji-picker" ref={pickerRef}>
      <div className="emoji-grid">
        {EMOJI_LIST.map((emoji) => (
          <button
            key={emoji}
            className="emoji-btn"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
