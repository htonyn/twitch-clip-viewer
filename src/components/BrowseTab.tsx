import { useState } from 'react';
import type { Clip } from '../types';
import { fetchChannelClips } from '../lib/twitch';

interface BrowseTabProps {
  active: boolean;
  clientId: string;
  setClientId: (value: string) => void;
  oauthToken: string;
  setOauthToken: (value: string) => void;
  addClips: (clips: Clip[]) => { addedCount: number; firstNewIndex: number };
}

export function BrowseTab({ active, clientId, setClientId, oauthToken, setOauthToken, addClips }: BrowseTabProps) {
  const [channel, setChannel] = useState('');
  const [clipCount, setClipCount] = useState('12');
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'ok'; msg: string } | null>(null);

  async function handleFetch() {
    const id = clientId.trim();
    const token = oauthToken.trim();
    const channelName = channel.trim();
    const count = Math.min(Math.max(parseInt(clipCount) || 12, 1), 100);

    if (!id || !token || !channelName) {
      setStatus({ type: 'error', msg: 'Client ID, access token, and a channel name are all required.' });
      return;
    }

    setFetching(true);
    setStatus(null);

    try {
      const { clips, displayName } = await fetchChannelClips(channelName, count, id, token);
      if (clips.length === 0) {
        setStatus({ type: 'error', msg: 'No clips found for that channel.' });
        return;
      }
      const { addedCount } = addClips(clips);
      setStatus({ type: 'ok', msg: `Pulled ${addedCount} new clip${addedCount === 1 ? '' : 's'} from ${displayName}.` });
    } catch (err) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className={'tab-panel' + (active ? ' active' : '')}>
      <div className="field">
        <label htmlFor="clientId">Client ID</label>
        <input
          type="text"
          id="clientId"
          placeholder="from dev.twitch.tv/console/apps"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="oauthToken">App Access Token</label>
        <input
          type="password"
          id="oauthToken"
          placeholder="Bearer token (App or User access token)"
          value={oauthToken}
          onChange={(e) => setOauthToken(e.target.value)}
        />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="channelName">Channel</label>
          <input
            type="text"
            id="channelName"
            placeholder="e.g. pokimane"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="clipCount">How many</label>
          <input type="text" id="clipCount" value={clipCount} onChange={(e) => setClipCount(e.target.value)} />
        </div>
      </div>
      <button className="primary" disabled={fetching} onClick={handleFetch}>
        {fetching ? 'Fetching…' : 'Fetch clips'}
      </button>
      <div className="hint">
        Requires a free Twitch Client ID + access token — the Helix API has no anonymous mode. Register an app at{' '}
        <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener">
          dev.twitch.tv/console/apps
        </a>
        , then generate a Client Credentials app access token. Nothing here is stored — the fields clear on reload.
      </div>
      {status && <div className={`status-msg ${status.type}`}>{status.msg}</div>}
    </div>
  );
}
