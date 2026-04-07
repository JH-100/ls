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
      <div className="search-input-row">
        <SearchIcon size={16} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="메시지 검색..."
          className="search-input"
        />
        <button className="icon-btn" onClick={onClose}>
          <XIcon size={16} />
        </button>
      </div>
      {results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <div key={r.id} className="search-result-item">
              <div className="search-result-meta">
                <span className="search-result-channel">#{r.channel_name}</span>
                <span className="search-result-author">{r.display_name}</span>
              </div>
              <div
                className="search-result-content"
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
    '<mark>$1</mark>'
  );
}
