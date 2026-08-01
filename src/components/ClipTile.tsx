import type { Clip } from '../types';
import { formatDate, formatViews } from '../lib/format';

interface ClipTileProps {
  clip: Clip;
  isPlaying: boolean;
  onPlay: () => void;
}

export function ClipTile({ clip, isPlaying, onPlay }: ClipTileProps) {
  const dateStr = formatDate(clip.createdAt);
  const viewsStr = formatViews(clip.viewCount);
  const subParts = [];
  if (clip.duration) subParts.push(clip.duration + 's');
  if (dateStr) subParts.push(dateStr);
  if (viewsStr) subParts.push(viewsStr);

  return (
    <div className={'clip-tile' + (isPlaying ? ' playing' : '')} onClick={onPlay}>
      <div className="clip-tile-thumb">
        {clip.thumb ? <img src={clip.thumb} alt="" /> : <div className="thumb-fallback">CLIP</div>}
        <a
          className="clip-tile-open"
          href={`https://clips.twitch.tv/${encodeURIComponent(clip.slug)}`}
          target="_blank"
          rel="noopener"
          title="Open clip on Twitch"
          onClick={(e) => e.stopPropagation()}
        >
          ↗
        </a>
      </div>
      <div className="info">
        <div className="title">{clip.title || clip.slug}</div>
        {subParts.length > 0 && <div className="sub">{subParts.join(' · ')}</div>}
        {clip.creatorName && <div className="sub sub-clipper">Clipped by {clip.creatorName}</div>}
      </div>
    </div>
  );
}
