import { useState } from 'react';
import type { Clip } from '../types';

export function useClipQueue() {
  const [queue, setQueue] = useState<Clip[]>([]);
  const [playingIndex, setPlayingIndex] = useState(-1);

  function addClips(clips: Clip[]) {
    const existingSlugs = new Set(queue.map((c) => c.slug));
    const toAdd = clips.filter((c) => !existingSlugs.has(c.slug));
    const firstNewIndex = queue.length;
    if (toAdd.length > 0) {
      setQueue((prev) => [...prev, ...toAdd]);
    }
    return { addedCount: toAdd.length, firstNewIndex };
  }

  function removeClip(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    setPlayingIndex((prev) => {
      if (prev === index) return -1;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  function play(index: number) {
    setPlayingIndex(index);
  }

  return { queue, playingIndex, addClips, removeClip, play };
}
