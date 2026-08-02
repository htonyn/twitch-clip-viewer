import type { ReactNode } from 'react';
import type { Clip } from '../types';
import { formatDate, formatViews } from '../lib/format';
import { joinParts } from '../lib/joinParts';
import { deriveClipDownloadUrl } from '../lib/clipDownload';
import { CopyDate } from './CopyDate';

interface ClipTileProps {
  clip: Clip;
  isPlaying: boolean;
  onPlay: () => void;
}

export function ClipTile({ clip, isPlaying, onPlay }: ClipTileProps) {
  const dateStr = formatDate(clip.createdAt);
  const viewsStr = formatViews(clip.viewCount);
  const subParts: ReactNode[] = [];
  if (clip.duration) subParts.push(`${clip.duration}s`);
  if (dateStr) subParts.push(<CopyDate key="date" iso={clip.createdAt} displayText={dateStr} />);
  if (viewsStr) subParts.push(viewsStr);

  const downloadUrl = deriveClipDownloadUrl(clip.thumb);

  return (
    <div className={'clip-tile' + (isPlaying ? ' playing' : '')} onClick={onPlay}>
      <div className="clip-tile-thumb">
        {clip.thumb ? <img src={clip.thumb} alt="" /> : <div className="thumb-fallback">CLIP</div>}
        <div className="clip-tile-actions">
          {downloadUrl && (
            <a
              className="clip-tile-action"
              href={downloadUrl}
              download={`${clip.slug}.mp4`}
              target="_blank"
              rel="noopener"
              title="Download clip"
              onClick={(e) => e.stopPropagation()}
            >
              ⬇
            </a>
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
