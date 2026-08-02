import { useEffect, useState } from 'react';
import type { ChannelInfo, Clip } from '../types';
import {
  channelInfoFromHelix,
  extractSlug,
  fetchClipsByIds,
  fetchRecentClipsForBroadcaster,
  fetchUserByLogin,
} from '../lib/twitch';
import { ChannelDetails } from './ChannelDetails';
import { ClipLookup } from './ClipLookup';
import { ClipsMenu } from './ClipsMenu';

interface ChannelSearchProps {
  clientId: string;
  accessToken: string;
}

export function ChannelSearch({ clientId, accessToken }: ChannelSearchProps) {
  const [channel, setChannel] = useState('chocoTaco');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [clipLookupLoading, setClipLookupLoading] = useState(false);

  async function handleSearch() {
    const name = channel.trim();
    if (!name) {
      setError('Enter a channel name first.');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const user = await fetchUserByLogin(name, clientId, accessToken);
      setChannelInfo(channelInfoFromHelix(user));
      const found = await fetchRecentClipsForBroadcaster(user.id, 20, clientId, accessToken);
      setClips(found);
      setPlayingIndex(found.length > 0 ? 0 : -1);
      if (found.length === 0) setError(`No clips found for ${user.display_name}.`);
    } catch (err) {
      setChannelInfo(null);
      setClips([]);
      setPlayingIndex(-1);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    handleSearch();
    // Auto-search the default channel once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClipLookup(rawInput: string) {
    const slug = extractSlug(rawInput) ?? rawInput.trim();
    if (!slug) {
      setError('Enter a clip ID or URL first.');
      return;
    }
    setClipLookupLoading(true);
    setError(null);
    try {
      const map = await fetchClipsByIds([slug], clientId, accessToken);
      const found = map[slug];
      if (!found) {
        setError(`No clip found with ID "${slug}".`);
        return;
      }
      const existingIndex = clips.findIndex((c) => c.slug === found.slug);
      if (existingIndex !== -1) {
        setPlayingIndex(existingIndex);
      } else {
        setClips((prev) => [found, ...prev]);
        setPlayingIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClipLookupLoading(false);
    }
  }

  return (
    <div className="channel-search-wrap">
      <div className="channel-search">
        <input
          type="text"
          placeholder="Enter a channel name…"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <button className="primary" disabled={searching} onClick={handleSearch}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <div className="status-msg error">{error}</div>}

      {channelInfo && (
        <>
          <ChannelDetails info={channelInfo} />
          <ClipLookup onLookup={handleClipLookup} loading={clipLookupLoading} />
        </>
      )}
      <ClipsMenu clips={clips} playingIndex={playingIndex} onPlay={setPlayingIndex} />
    </div>
  );
}
