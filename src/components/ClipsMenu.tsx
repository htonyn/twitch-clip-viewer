import type { Clip } from '../types';
import { Player } from './Player';
import { ClipTile } from './ClipTile';

interface ClipsMenuProps {
  clips: Clip[];
  playingIndex: number;
  onPlay: (index: number) => void;
}

export function ClipsMenu({ clips, playingIndex, onPlay }: ClipsMenuProps) {
  if (clips.length === 0) return null;

  return (
    <div className="clip-results">
      <Player clip={playingIndex >= 0 ? clips[playingIndex] : null} />
      <div className="clip-results-head">Recent clips</div>
      <div className="clip-grid">
        {clips.map((clip, i) => (
          <ClipTile key={clip.slug} clip={clip} isPlaying={i === playingIndex} onPlay={() => onPlay(i)} />
        ))}
      </div>
    </div>
  );
}
