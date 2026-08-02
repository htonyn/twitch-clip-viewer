import { useState } from 'react';

interface ClipLookupProps {
  onSearch: (rawInput: string) => void;
  loading: boolean;
  indexing: boolean;
}

export function ClipLookup({ onSearch, loading, indexing }: ClipLookupProps) {
  const [value, setValue] = useState('');

  function submit() {
    onSearch(value);
  }

  return (
    <div className="clip-lookup">
      <div className="clip-lookup-row">
        <input
          type="text"
          placeholder="Paste a clip ID/URL, or search by clip title…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button className="primary" disabled={loading} onClick={submit}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {indexing && <div className="clip-lookup-hint">Indexing this channel's clips in the background for title search…</div>}
    </div>
  );
}
