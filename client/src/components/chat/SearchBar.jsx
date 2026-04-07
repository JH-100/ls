import { useState, useCallback, useEffect, useRef } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { debounce } from '../../utils/debounce';
import { XIcon, SearchIcon } from '../icons';

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { searchMessages } = useMessages();
  const inputRef = useRef(null);

  const debouncedSearch = useCallback(
    debounce(async (q) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      const res = await searchMessages(q.trim());
      setResults(res || []);
    }, 300),
    [searchMessages]
  );

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      debouncedSearch(val);
    },
    [debouncedSearch]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="메시지 검색..."
      />
      <button className="icon-btn" onClick={onClose}>
        <XIcon size={16} />
      </button>
      {results.length > 0 && (
        <div>
          {results.map((r) => (
            <div key={r.id} className="search-result">
              <span className="channel-tag">#{r.channel_name}</span>
              {' '}<span>{r.display_name}</span>
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightQuery(r.content, query),
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightQuery(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<span class="highlight">$1</span>'
  );
}
