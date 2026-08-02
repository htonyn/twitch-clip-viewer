import type { ChannelInfo, Clip } from '../types';
import { ClipLookup } from './ClipLookup';
import { ClipList } from './ClipList';

interface ChannelResultsProps {
  error: string | null;
  channelInfo: ChannelInfo | null;
  clips: Clip[];
  isSearchResult: boolean;
  searching: boolean;
  categoryNames: Record<string, string>;
  playingIndex: number;
  onPlay: (index: number) => void;
  clipLookupLoading: boolean;
  indexingClips: boolean;
  onClipSearch: (rawInput: string) => void;
  onAddToList: (clip: Clip) => void;
}

export function ChannelResults({
  error,
  channelInfo,
  clips,
  isSearchResult,
  searching,
  categoryNames,
  playingIndex,
  onPlay,
  clipLookupLoading,
  indexingClips,
  onClipSearch,
  onAddToList,
}: ChannelResultsProps) {
  return (
    <>
      {channelInfo && <ClipLookup onSearch={onClipSearch} loading={clipLookupLoading} indexing={indexingClips} />}
      <ClipList
        clips={clips}
        isSearchResult={isSearchResult}
        searching={searching}
        indexingClips={indexingClips}
        categoryNames={categoryNames}
        playingIndex={playingIndex}
        onPlay={onPlay}
        onAddToList={onAddToList}
      />
      {error && <div className="status-msg error">{error}</div>}
    </>
  );
}
