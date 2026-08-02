import type { ReactNode } from 'react';

export function joinParts(parts: ReactNode[], separator: ReactNode): ReactNode[] {
  return parts.flatMap((part, i) => (i === 0 ? [part] : [separator, part]));
}
