import { useMemo, useState } from 'react';
import type { Clip } from '../types';
import { ClipTile } from './ClipTile';

const UNCATEGORIZED = 'Uncategorized';

interface ClipListProps {
  clips: Clip[];
  isSearchResult: boolean;
  searching: boolean;
  indexingClips: boolean;
  categoryNames: Record<string, string>;
  playingIndex: number;
  onPlay: (index: number) => void;
  onAddToList: (clip: Clip) => void;
}

export function ClipList({
  clips,
  isSearchResult,
  searching,
  indexingClips,
  categoryNames,
  playingIndex,
  onPlay,
  onAddToList,
}: ClipListProps) {
  const [category, setCategory] = useState('');

  const categoryOf = (clip: Clip) => (clip.categoryId ? (categoryNames[clip.categoryId] ?? null) : UNCATEGORIZED);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    clips.forEach((c) => {
      const name = categoryOf(c);
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, categoryNames]);

  const indexed = clips.map((clip, i) => ({ clip, i }));
  const visible = category ? indexed.filter(({ clip }) => categoryOf(clip) === category) : indexed;

  // While a search/fetch is in flight, render nothing rather than briefly flashing "No results"
  // before the real results (or a genuine empty result) land.
  if (clips.length === 0 && searching) return null;

  return (
    <div className="clip-list">
      <div className="clip-list-head-row">
        <div className="clip-list-head">
          {isSearchResult ? 'Results' : 'Recent clips'} <span className="clip-list-count">({visible.length})</span>
        </div>
        {categoryOptions.length > 1 && (
          <select className="clip-list-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>
      {clips.length === 0 ? (
        <div className="playlist-empty">
          {isSearchResult && indexingClips ? 'No results found so far — still indexing this channel’s clips.' : 'No results found.'}
        </div>
      ) : visible.length === 0 ? (
        <div className="playlist-empty">No clips in "{category}".</div>
      ) : (
        <div className="clip-grid-scroll">
          <div className="clip-grid">
            {visible.map(({ clip, i }) => (
              <ClipTile
                key={clip.slug}
                clip={clip}
                isPlaying={i === playingIndex}
                onPlay={() => onPlay(i)}
                onAddToList={onAddToList}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
