import { useEffect, useRef, useState } from 'react';
import type { ChannelInfo, Clip } from '../types';
import {
  channelInfoFromHelix,
  extractSlug,
  fetchAllClipsForBroadcaster,
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

  // Full-catalog clip index, built progressively in the background so title search has more to
  // search over than just the ~20 "recent" clips shown in the grid. Keyed by slug to de-dupe.
  const allClipsMapRef = useRef(new Map<string, Clip>());
  const [indexingClips, setIndexingClips] = useState(false);
  const searchGenRef = useRef(0);

  async function handleSearch() {
    const name = channel.trim();
    if (!name) {
      setError('Enter a channel name first.');
      return;
    }
    const myGen = ++searchGenRef.current;
    allClipsMapRef.current = new Map();
    setSearching(true);
    setError(null);
    try {
      const user = await fetchUserByLogin(name, clientId, accessToken);
      if (searchGenRef.current !== myGen) return;
      setChannelInfo(channelInfoFromHelix(user));
      const found = await fetchRecentClipsForBroadcaster(user.id, 20, clientId, accessToken);
      if (searchGenRef.current !== myGen) return;
      setClips(found);
      setPlayingIndex(found.length > 0 ? 0 : -1);
      if (found.length === 0) setError(`No clips found for ${user.display_name}.`);

      // Kick off the full-catalog background index (not awaited — fire and forget).
      setIndexingClips(true);
      fetchAllClipsForBroadcaster(user.id, clientId, accessToken, (page) => {
        if (searchGenRef.current !== myGen) return;
        page.forEach((c) => allClipsMapRef.current.set(c.slug, c));
      })
        .catch(() => {})
        .finally(() => {
          if (searchGenRef.current === myGen) setIndexingClips(false);
        });
    } catch (err) {
      if (searchGenRef.current !== myGen) return;
      setChannelInfo(null);
      setClips([]);
      setPlayingIndex(-1);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (searchGenRef.current === myGen) setSearching(false);
    }
  }

  useEffect(() => {
    handleSearch();
    // Auto-search the default channel once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClipSearch(rawInput: string) {
    const query = rawInput.trim();
    if (!query) {
      setError('Enter a clip ID, URL, or title to search for.');
      return;
    }
    setClipLookupLoading(true);
    setError(null);
    try {
      const slug = extractSlug(rawInput);
      if (slug) {
        const map = await fetchClipsByIds([slug], clientId, accessToken);
        const found = map[slug];
        if (found) {
          const existingIndex = clips.findIndex((c) => c.slug === found.slug);
          if (existingIndex !== -1) {
            setPlayingIndex(existingIndex);
          } else {
            setClips((prev) => [found, ...prev]);
            setPlayingIndex(0);
          }
          return;
        }
        // Looked like a clip ID/URL but didn't resolve to a real clip — fall through to title search.
      }

      const q = query.toLowerCase();
      const matches = Array.from(allClipsMapRef.current.values()).filter((c) =>
        (c.title ?? '').toLowerCase().includes(q),
      );
      if (matches.length === 0) {
        setError(
          indexingClips
            ? `No clips found matching "${query}" so far — still indexing this channel's clips.`
            : `No clips found matching "${query}".`,
        );
        return;
      }
      setClips(matches);
      setPlayingIndex(0);
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
          <ClipLookup onSearch={handleClipSearch} loading={clipLookupLoading} indexing={indexingClips} />
        </>
      )}
      <ClipsMenu clips={clips} playingIndex={playingIndex} onPlay={setPlayingIndex} />
    </div>
  );
}
