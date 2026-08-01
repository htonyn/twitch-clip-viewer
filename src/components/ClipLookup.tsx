import { useState } from 'react';

interface ClipLookupProps {
  onLookup: (rawInput: string) => void;
  loading: boolean;
}

export function ClipLookup({ onLookup, loading }: ClipLookupProps) {
  const [value, setValue] = useState('');

  function submit() {
    onLookup(value);
  }

  return (
    <div className="clip-lookup">
      <input
        type="text"
        placeholder="Have a clip ID or URL? Jump straight to it…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <button className="primary" disabled={loading} onClick={submit}>
        {loading ? 'Finding…' : 'Find clip'}
      </button>
    </div>
  );
}
