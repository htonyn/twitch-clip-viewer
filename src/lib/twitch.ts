import type { ChannelInfo, Clip, HelixClip, HelixGame, HelixUser } from '../types';

export function extractSlug(url: string): string | null {
  url = url.trim();
  if (!url) return null;
  try {
    // Accept bare slugs too
    if (!/^https?:\/\//i.test(url) && /^[A-Za-z0-9_-]+$/.test(url) && url.length > 8) {
      return url;
    }
    const u = new URL(url);
    // clips.twitch.tv/SLUG
    if (u.hostname.includes('clips.twitch.tv')) {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length) return parts[parts.length - 1];
    }
    // twitch.tv/channel/clip/SLUG  or m.twitch.tv/channel/clip/SLUG
    if (u.hostname.includes('twitch.tv')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('clip');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export function embedParent(): string {
  // Twitch embeds require a matching &parent= param for the hosting domain.
  return location.hostname || 'localhost';
}

function clipFromHelix(c: HelixClip, source: Clip['source']): Clip {
  return {
    slug: c.id,
    title: c.title,
    thumb: c.thumbnail_url,
    channel: c.broadcaster_name,
    creatorName: c.creator_name,
    duration: c.duration,
    createdAt: c.created_at,
    viewCount: c.view_count,
    categoryId: c.game_id || null,
    source,
  };
}

// Helix's Clips endpoint only returns a game_id, not a category name — resolving names requires
// this separate Get Games call. Ignores unresolvable/empty ids and swallows request failures
// (returns whatever did resolve, or {} if the request itself failed) since this only feeds an
// optional client-side filter, not anything that should be able to break the clip list.
export async function fetchGameNames(ids: string[], clientId: string, token: string): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return {};
  const params = uniqueIds.map((id) => 'id=' + encodeURIComponent(id)).join('&');
  const res = await fetch(`https://api.twitch.tv/helix/games?${params}`, {
    headers: { 'Client-Id': clientId, Authorization: 'Bearer ' + token },
  });
  if (!res.ok) return {};
  const data: { data?: HelixGame[] } = await res.json();
  const map: Record<string, string> = {};
  (data.data || []).forEach((g) => {
    map[g.id] = g.name;
  });
  return map;
}

// Helix allows multiple id= params per request, up to 100.
export async function fetchClipsByIds(
  ids: string[],
  clientId: string,
  token: string,
): Promise<Record<string, Clip>> {
  const params = ids.map((id) => 'id=' + encodeURIComponent(id)).join('&');
  const res = await fetch(`https://api.twitch.tv/helix/clips?${params}`, {
    headers: { 'Client-Id': clientId, Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: { data?: HelixClip[] } = await res.json();
  const map: Record<string, Clip> = {};
  (data.data || []).forEach((c) => {
    map[c.id] = clipFromHelix(c, 'manual');
  });
  return map;
}

export async function fetchAuthenticatedUser(clientId: string, token: string): Promise<HelixUser> {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Client-Id': clientId, Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: { data?: HelixUser[] } = await res.json();
  if (!data.data || data.data.length === 0) throw new Error('No user profile returned for this token.');
  return data.data[0];
}

export function channelInfoFromHelix(u: HelixUser): ChannelInfo {
  return {
    id: u.id,
    login: u.login,
    displayName: u.display_name,
    profileImageUrl: u.profile_image_url,
    description: u.description,
    broadcasterType: u.broadcaster_type,
    totalViewCount: u.view_count,
    createdAt: u.created_at,
  };
}

export async function fetchUserByLogin(channel: string, clientId: string, token: string): Promise<HelixUser> {
  const headers = { 'Client-Id': clientId, Authorization: 'Bearer ' + token };
  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(channel)}`, {
    headers,
  });
  if (!userRes.ok) {
    throw new Error(`Couldn't verify that channel (HTTP ${userRes.status}). Check your Client ID and token.`);
  }
  const userData: { data?: HelixUser[] } = await userRes.json();
  if (!userData.data || userData.data.length === 0) {
    throw new Error(`No Twitch channel found named "${channel}".`);
  }
  return userData.data[0];
}

// Helix's /clips endpoint, when called without started_at/ended_at, returns the broadcaster's
// all-time most-viewed clips (sorted by view count) rather than anything recent. To get
// genuinely recent clips we have to scope the request to a date window ourselves, widening it
// until we find something — a low-activity channel's "recent" clips might be a year old.
const RECENCY_WINDOWS_DAYS = [30, 90, 365, 730];

async function fetchClipsWindow(
  broadcasterId: string,
  headers: Record<string, string>,
  startedAt?: string,
  endedAt?: string,
): Promise<HelixClip[]> {
  const params = new URLSearchParams({ broadcaster_id: broadcasterId, first: '100' });
  if (startedAt) params.set('started_at', startedAt);
  if (endedAt) params.set('ended_at', endedAt);
  const res = await fetch(`https://api.twitch.tv/helix/clips?${params.toString()}`, { headers });
  if (!res.ok) throw new Error(`Fetching clips failed (HTTP ${res.status}).`);
  const data: { data?: HelixClip[] } = await res.json();
  return data.data || [];
}

export async function fetchRecentClipsForBroadcaster(
  broadcasterId: string,
  count: number,
  clientId: string,
  token: string,
): Promise<Clip[]> {
  const headers = { 'Client-Id': clientId, Authorization: 'Bearer ' + token };

  const now = new Date();
  let rawClips: HelixClip[] = [];
  for (const days of RECENCY_WINDOWS_DAYS) {
    const startedAt = new Date(now.getTime() - days * 86400000).toISOString();
    rawClips = await fetchClipsWindow(broadcasterId, headers, startedAt, now.toISOString());
    if (rawClips.length > 0) break;
  }
  if (rawClips.length === 0) {
    // Last resort: this channel has no clips within the last ~2 years, so fall back to its
    // all-time top clips just so the search doesn't come back empty.
    rawClips = await fetchClipsWindow(broadcasterId, headers);
  }

  const sorted = [...rawClips].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return sorted.slice(0, count).map((c) => clipFromHelix(c, 'api'));
}

export async function fetchChannelClips(
  channel: string,
  count: number,
  clientId: string,
  token: string,
): Promise<{ clips: Clip[]; displayName: string }> {
  const user = await fetchUserByLogin(channel, clientId, token);
  const clips = await fetchRecentClipsForBroadcaster(user.id, count, clientId, token);
  return { clips, displayName: user.display_name };
}

// Twitch has no "search clips by title" endpoint, so title search is done client-side against
// every clip we can pull for the broadcaster. Naively paginating the unscoped /clips endpoint via
// `after` stops handing back a cursor well short of a large channel's actual clip count (observed:
// ~1,100 clips returned for a channel with 20k+) — the endpoint sorts by view count when there's no
// date range, and cursor depth into that sort appears to be capped server-side. Scoping each page
// of pagination to a bounded date window keeps each window's own result count under that cap, and
// walking windows backward in time covers the full history.
// Stops walking further back once several consecutive windows come back empty (assumed to mean no
// more clips exist further back), bounded by INDEX_MAX_WINDOWS as a hard safety cap regardless.
// Stops early and quietly on any request failure (e.g. rate limiting) rather than throwing, since
// this runs as a best-effort background task.
const INDEX_WINDOW_DAYS = 30;
const INDEX_MAX_EMPTY_WINDOW_STREAK = 6;
const INDEX_MAX_WINDOWS = 200;

export async function fetchAllClipsForBroadcaster(
  broadcasterId: string,
  clientId: string,
  token: string,
  onPage: (clips: Clip[]) => void,
  maxPagesPerWindow = 20,
): Promise<void> {
  const headers = { 'Client-Id': clientId, Authorization: 'Bearer ' + token };
  let windowEnd = new Date();
  let emptyStreak = 0;

  for (let w = 0; w < INDEX_MAX_WINDOWS && emptyStreak < INDEX_MAX_EMPTY_WINDOW_STREAK; w++) {
    const windowStart = new Date(windowEnd.getTime() - INDEX_WINDOW_DAYS * 86400000);
    const startedAt = windowStart.toISOString();
    const endedAt = windowEnd.toISOString();

    let cursor: string | undefined;
    let pages = 0;
    let windowTotal = 0;

    do {
      const params = new URLSearchParams({
        broadcaster_id: broadcasterId,
        first: '100',
        started_at: startedAt,
        ended_at: endedAt,
      });
      if (cursor) params.set('after', cursor);
      const res = await fetch(`https://api.twitch.tv/helix/clips?${params.toString()}`, { headers });
      if (!res.ok) {
        console.warn(
          `[clip-index] stopped: window ${startedAt}..${endedAt} page ${pages + 1} returned ${res.status} ${res.statusText}`,
          await res.text().catch(() => ''),
        );
        return;
      }
      const data: { data?: HelixClip[]; pagination?: { cursor?: string } } = await res.json();
      const batch = data.data || [];
      console.debug(
        `[clip-index] window ${startedAt}..${endedAt} page ${pages + 1}: got ${batch.length}, cursor=${data.pagination?.cursor ?? '(none)'}`,
      );
      if (batch.length > 0) onPage(batch.map((c) => clipFromHelix(c, 'api')));
      windowTotal += batch.length;
      cursor = data.pagination?.cursor;
      pages++;
    } while (cursor && pages < maxPagesPerWindow);

    emptyStreak = windowTotal === 0 ? emptyStreak + 1 : 0;
    windowEnd = windowStart;
  }
}
