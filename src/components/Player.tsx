import type { ReactNode } from 'react';
import type { Clip } from '../types';
import { embedParent } from '../lib/twitch';
import { formatDate, formatViews } from '../lib/format';
import { joinParts } from '../lib/joinParts';
import { CopyDate } from './CopyDate';

interface PlayerProps {
  clip: Clip | null;
}

export function Player({ clip }: PlayerProps) {
  if (!clip) {
    return (
      <div className="player-shell">
        <div className="empty-stage">
          <div className="glyph">▷</div>
          <p>
            Nothing loaded yet. Search a channel or look up a clip on the left, then pick one to play it here.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip.slug)}&parent=${encodeURIComponent(embedParent())}&autoplay=false`;
  const npParts: ReactNode[] = [];
  if (clip.channel) npParts.push(clip.channel);
  if (clip.creatorName) npParts.push(`Clipped by ${clip.creatorName}`);
  const npDate = formatDate(clip.createdAt);
  if (npDate) npParts.push(<CopyDate key="date" iso={clip.createdAt} displayText={npDate} />);
  const npViews = formatViews(clip.viewCount);
  if (npViews) npParts.push(npViews);
  npParts.push(clip.slug);

  return (
    <>
      <div className="player-shell">
        <iframe src={src} allowFullScreen scrolling="no" allow="autoplay" />
      </div>
      <div className="now-playing">
        <div>
          <div className="title">{clip.title || clip.slug}</div>
          <div className="meta">{joinParts(npParts, ' · ')}</div>
        </div>
      </div>
    </>
  );
}
