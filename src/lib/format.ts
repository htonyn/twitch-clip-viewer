export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const yy = String(d.getFullYear() % 100).padStart(2, '0');
  return `${yy}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function formatViews(count: number | null): string | null {
  if (count == null) return null;
  const formatted = count >= 1_000_000 ? `${(count / 1_000_000).toFixed(1)}M` : count >= 1_000 ? `${(count / 1_000).toFixed(1)}K` : String(count);
  return `${formatted} view${count === 1 ? '' : 's'}`;
}
