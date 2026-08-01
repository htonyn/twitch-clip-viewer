import type { Clip } from '../types';
import { embedParent } from '../lib/twitch';
import { formatDate, formatViews } from '../lib/format';

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
            Nothing loaded yet. Paste a clip URL below, or pull clips from a channel, then pick one from the reel to
            play it here.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clip.slug)}&parent=${encodeURIComponent(embedParent())}&autoplay=true`;
  const npParts = [];
  if (clip.channel) npParts.push(clip.channel);
  if (clip.creatorName) npParts.push(`Clipped by ${clip.creatorName}`);
  const npDate = formatDate(clip.createdAt);
  if (npDate) npParts.push(npDate);
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
          <div className="meta">{npParts.join(' · ')}</div>
        </div>
      </div>
    </>
  );
}
