import { useState } from 'react';
import type { Clip } from '../types';
import { extractSlug, fetchClipsByIds } from '../lib/twitch';

interface PasteTabProps {
  active: boolean;
  clientId: string;
  oauthToken: string;
  playingIndex: number;
  addClips: (clips: Clip[]) => { addedCount: number; firstNewIndex: number };
  play: (index: number) => void;
}

export function PasteTab({ active, clientId, oauthToken, playingIndex, addClips, play }: PasteTabProps) {
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'ok'; msg: string } | null>(null);
  const [fetching, setFetching] = useState(false);

  async function handleAdd() {
    const lines = urlInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setStatus({ type: 'error', msg: 'Paste at least one clip URL first.' });
      return;
    }

    const slugs: string[] = [];
    let failed = 0;
    lines.forEach((line) => {
      const slug = extractSlug(line);
      if (!slug) {
        failed++;
        return;
      }
      if (!slugs.includes(slug)) slugs.push(slug);
    });

    if (slugs.length === 0) {
      setStatus({ type: 'error', msg: "Couldn't parse any of those as clip URLs — check the format." });
      return;
    }

    const id = clientId.trim();
    const token = oauthToken.trim();
    const hasCreds = Boolean(id && token);

    let metaMap: Record<string, Clip> = {};
    let metaError = false;
    if (hasCreds) {
      setFetching(true);
      try {
        metaMap = await fetchClipsByIds(slugs, id, token);
      } catch {
        metaError = true;
      }
      setFetching(false);
    }

    const clipsToAdd: Clip[] = slugs.map((slug) => {
      const m = metaMap[slug];
      if (m) return m;
      return {
        slug,
        title: null,
        thumb: null,
        channel: null,
        creatorName: null,
        duration: null,
        createdAt: null,
        viewCount: null,
        categoryId: null,
        source: 'manual',
      };
    });

    const { addedCount, firstNewIndex } = addClips(clipsToAdd);
    if (addedCount > 0 && playingIndex === -1) play(firstNewIndex);

    let msg = `Added ${addedCount} clip${addedCount === 1 ? '' : 's'} to the reel.`;
    if (failed) msg += ` Couldn't parse ${failed} line${failed === 1 ? '' : 's'}.`;
    if (hasCreds && metaError) {
      msg += ` Couldn't fetch metadata (check your Client ID/token) — added with placeholders instead.`;
    } else if (!hasCreds) {
      msg += ` Add a Client ID + token on the Browse tab to also pull thumbnails, titles, and upload dates.`;
    }
    setStatus({ type: (failed || metaError) && !addedCount ? 'error' : 'ok', msg });
    setUrlInput('');
  }

  return (
    <div className={'tab-panel' + (active ? ' active' : '')}>
      <div className="field">
        <label htmlFor="urlInput">Clip URL(s) — one per line</label>
        <textarea
          id="urlInput"
          placeholder={
            'https://clips.twitch.tv/SomeClipSlugHere\nhttps://www.twitch.tv/channelname/clip/AnotherSlug'
          }
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
      </div>
      <button className="primary" disabled={fetching} onClick={handleAdd}>
        {fetching ? 'Fetching details…' : 'Add to reel'}
      </button>
      <div className="hint">
        No API key needed to add and play clips. If you've entered a Client ID + token on the Browse tab, pasted
        clips will also pick up their real thumbnail, title, and upload date. Works with any twitch.tv clip link,
        m.twitch.tv, or clips.twitch.tv.
      </div>
      {status && <div className={`status-msg ${status.type}`}>{status.msg}</div>}
    </div>
  );
}
