import type { ReactNode } from 'react';
import type { Clip } from '../types';
import { formatDate, formatViews } from '../lib/format';
import { joinParts } from '../lib/joinParts';
import { CopyDate } from './CopyDate';

interface ClipTileProps {
  clip: Clip;
  isPlaying: boolean;
  onPlay: () => void;
  onAddToList?: (clip: Clip) => void;
  onRemove?: (clip: Clip) => void;
}

export function ClipTile({ clip, isPlaying, onPlay, onAddToList, onRemove }: ClipTileProps) {
  const dateStr = formatDate(clip.createdAt);
  const viewsStr = formatViews(clip.viewCount);
  const subParts: ReactNode[] = [];
  if (clip.duration) subParts.push(`${clip.duration}s`);
  if (dateStr) subParts.push(<CopyDate key="date" iso={clip.createdAt} displayText={dateStr} />);
  if (viewsStr) subParts.push(viewsStr);

  return (
    <div className={'clip-tile' + (isPlaying ? ' playing' : '')} onClick={onPlay}>
      <div className="clip-tile-thumb">
        {clip.thumb ? <img src={clip.thumb} alt="" /> : <div className="thumb-fallback">CLIP</div>}
        <div className="clip-tile-actions">
          {onAddToList && (
            <button
              className="clip-tile-action"
              title="Add to list"
              onClick={(e) => {
                e.stopPropagation();
                onAddToList(clip);
              }}
            >
              +
            </button>
          )}
          {onRemove && (
            <button
              className="clip-tile-action"
              title="Remove from list"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(clip);
              }}
            >
              ×
            </button>
          )}
          <a
            className="clip-tile-action"
            href={`https://clips.twitch.tv/${encodeURIComponent(clip.slug)}`}
            target="_blank"
            rel="noopener"
            title="Open clip on Twitch"
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        </div>
      </div>
      <div className="info">
        <div className="title">{clip.title || clip.slug}</div>
        {subParts.length > 0 && <div className="sub">{joinParts(subParts, ' · ')}</div>}
        {clip.creatorName && <div className="sub sub-clipper">Clipped by {clip.creatorName}</div>}
      </div>
    </div>
  );
}
