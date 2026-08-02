import type { ChannelInfo, Clip, HelixClip, HelixUser } from '../types';

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
    source,
  };
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
// every clip we can pull for the broadcaster. This paginates through the full catalog (sorted by
// view count server-side, but we don't care about order here) via the `after` cursor, handing
// back each page as it arrives so the caller can build up a searchable index progressively
// instead of waiting for everything. Capped at maxPages so a channel with tens of thousands of
// clips can't turn into an unbounded request loop; stops early and quietly on any request failure
// (e.g. rate limiting) rather than throwing, since this runs as a best-effort background task.
export async function fetchAllClipsForBroadcaster(
  broadcasterId: string,
  clientId: string,
  token: string,
  onPage: (clips: Clip[]) => void,
  maxPages = 50,
): Promise<void> {
  const headers = { 'Client-Id': clientId, Authorization: 'Bearer ' + token };
  let cursor: string | undefined;
  let pages = 0;

  do {
    const params = new URLSearchParams({ broadcaster_id: broadcasterId, first: '100' });
    if (cursor) params.set('after', cursor);
    const res = await fetch(`https://api.twitch.tv/helix/clips?${params.toString()}`, { headers });
    if (!res.ok) return;
    const data: { data?: HelixClip[]; pagination?: { cursor?: string } } = await res.json();
    const batch = data.data || [];
    if (batch.length > 0) onPage(batch.map((c) => clipFromHelix(c, 'api')));
    cursor = data.pagination?.cursor;
    pages++;
  } while (cursor && pages < maxPages);
}
