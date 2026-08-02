import { useState } from 'react';
import type { MouseEvent } from 'react';
import { formatDateShort } from '../lib/format';

interface CopyDateProps {
  iso: string | null;
  displayText: string;
}

export function CopyDate({ iso, displayText }: CopyDateProps) {
  const [copied, setCopied] = useState(false);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    const short = formatDateShort(iso);
    if (!short) return;
    navigator.clipboard.writeText(short).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <span className="copy-date" onClick={handleClick} title="Click to copy date (YY.M.D)">
      {copied ? 'Copied!' : displayText}
    </span>
  );
}
