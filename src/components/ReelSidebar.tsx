import type { Clip } from '../types';
import { ClipCard } from './ClipCard';

interface ReelSidebarProps {
  queue: Clip[];
  playingIndex: number;
  onPlay: (index: number) => void;
  onRemove: (index: number) => void;
}

export function ReelSidebar({ queue, playingIndex, onPlay, onRemove }: ReelSidebarProps) {
  return (
    <aside className="reel">
      <div className="reel-head">
        <h2>The Reel</h2>
        <div className="sub">Click any frame to play it</div>
      </div>
      <div className="reel-list">
        {queue.length === 0 ? (
          <div className="reel-empty">Your queue is empty. Add clips from either tab and they'll line up here.</div>
        ) : (
          queue.map((clip, i) => (
            <ClipCard
              key={clip.slug}
              clip={clip}
              isPlaying={i === playingIndex}
              onPlay={() => onPlay(i)}
              onRemove={() => onRemove(i)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
