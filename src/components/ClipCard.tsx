import type { Clip } from '../types';
import { formatDate } from '../lib/format';

interface ClipCardProps {
  clip: Clip;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

export function ClipCard({ clip, isPlaying, onPlay, onRemove }: ClipCardProps) {
  const dateStr = formatDate(clip.createdAt);
  const subParts = [clip.channel || 'unknown channel'];
  if (clip.duration) subParts.push(clip.duration + 's');
  if (dateStr) subParts.push(dateStr);

  return (
    <div className={'clip-card' + (isPlaying ? ' playing' : '')} onClick={onPlay}>
      {clip.thumb ? <img src={clip.thumb} alt="" /> : <div className="thumb-fallback">CLIP</div>}
      <div className="info">
        <div className="title">{clip.title || clip.slug}</div>
        <div className="sub">{subParts.join(' · ')}</div>
      </div>
      <button
        className="remove"
        title="Remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        &times;
      </button>
    </div>
  );
}
