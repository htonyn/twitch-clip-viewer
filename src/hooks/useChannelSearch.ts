import { useEffect, useRef, useState } from 'react';
import type { ChannelInfo, Clip } from '../types';
import {
  channelInfoFromHelix,
  extractSlug,
  fetchAllClipsForBroadcaster,
  fetchClipsByIds,
  fetchGameNames,
  fetchRecentClipsForBroadcaster,
  fetchUserByLogin,
} from '../lib/twitch';

export function useChannelSearch(clientId: string, accessToken: string) {
  const [channel, setChannel] = useState('chocoTaco');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [clipLookupLoading, setClipLookupLoading] = useState(false);

  // Full-catalog clip index, built progressively in the background so title search has more to
  // search over than just the ~20 "recent" clips shown in the grid. Keyed by slug to de-dupe.
  // The map itself lives in a ref (search reads it directly, no re-render needed for that), but
  // indexedCount is mirrored into state so the UI can show a live "N clips loaded" count.
  const allClipsMapRef = useRef(new Map<string, Clip>());
  const [indexedCount, setIndexedCount] = useState(0);
  const [indexingClips, setIndexingClips] = useState(false);
  const searchGenRef = useRef(0);

  // Category (game) names for whatever's currently in `clips` — Helix's clips only carry a
  // game_id, so names need a separate resolve. knownCategoryIdsRef tracks which ids we've already
  // asked about (successfully or not) so this doesn't refetch on every unrelated re-render.
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const knownCategoryIdsRef = useRef(new Set<string>());

  async function handleSearch() {
    const name = channel.trim();
    if (!name) {
      setError('Enter a channel name first.');
      return;
    }
    const myGen = ++searchGenRef.current;
    allClipsMapRef.current = new Map();
    setIndexedCount(0);
    setSearching(true);
    setError(null);
    try {
      const user = await fetchUserByLogin(name, clientId, accessToken);
      if (searchGenRef.current !== myGen) return;
      setChannelInfo(channelInfoFromHelix(user));
      const found = await fetchRecentClipsForBroadcaster(user.id, 20, clientId, accessToken);
      if (searchGenRef.current !== myGen) return;
      setClips(found);
      setIsSearchResult(false);
      setPlayingIndex(found.length > 0 ? 0 : -1);
      if (found.length === 0) setError(`No clips found for ${user.display_name}.`);

      // Kick off the full-catalog background index (not awaited — fire and forget).
      setIndexingClips(true);
      fetchAllClipsForBroadcaster(user.id, clientId, accessToken, (page) => {
        if (searchGenRef.current !== myGen) return;
        page.forEach((c) => allClipsMapRef.current.set(c.slug, c));
        setIndexedCount(allClipsMapRef.current.size);
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
    // This hook is called unconditionally from App (so Header and the results area share one
    // instance), but there's nothing to search until sign-in actually completes and a real
    // access token exists — fire the default search once that happens, not on hook-mount.
    if (!accessToken) return;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const missing = Array.from(
      new Set(
        clips
          .map((c) => c.categoryId)
          .filter((id): id is string => !!id && !knownCategoryIdsRef.current.has(id)),
      ),
    );
    if (missing.length === 0 || !clientId || !accessToken) return;
    missing.forEach((id) => knownCategoryIdsRef.current.add(id));
    fetchGameNames(missing, clientId, accessToken)
      .then((names) => setCategoryNames((prev) => ({ ...prev, ...names })))
      .catch(() => {});
  }, [clips, clientId, accessToken]);

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
          // A clip search always replaces the results, even if the clip was already visible.
          setClips([found]);
          setIsSearchResult(true);
          setPlayingIndex(0);
          return;
        }
        // Looked like a clip ID/URL but didn't resolve to a real clip — fall through to title search.
      }

      const q = query.toLowerCase();
      const matches = Array.from(allClipsMapRef.current.values()).filter((c) =>
        (c.title ?? '').toLowerCase().includes(q),
      );
      setClips(matches);
      setIsSearchResult(true);
      setPlayingIndex(matches.length > 0 ? 0 : -1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClipLookupLoading(false);
    }
  }

  return {
    channel,
    setChannel,
    searching,
    error,
    channelInfo,
    clips,
    isSearchResult,
    categoryNames,
    playingIndex,
    setPlayingIndex,
    clipLookupLoading,
    indexingClips,
    indexedCount,
    handleSearch,
    handleClipSearch,
  };
}
