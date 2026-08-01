import { useState } from 'react';
import type { TwitchAuthStatus } from '../hooks/useTwitchAuth';

interface TwitchAuthProps {
  status: TwitchAuthStatus;
  error: string | null;
  connect: (clientId: string) => void;
}

export function TwitchAuth({ status, error, connect }: TwitchAuthProps) {
  const [clientIdInput, setClientIdInput] = useState('');

  if (status === 'signed-in') return null;

  return (
    <div className="input-card">
      <div className="tab-panel active">
        <div className="field">
          <label htmlFor="oauthClientId">Twitch Client ID</label>
          <input
            type="text"
            id="oauthClientId"
            placeholder="from dev.twitch.tv/console/apps"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
          />
        </div>
        <button className="primary" disabled={status === 'connecting'} onClick={() => connect(clientIdInput)}>
          {status === 'connecting' ? 'Connecting…' : 'Connect with Twitch'}
        </button>
        <div className="hint">
          Register an app at{' '}
          <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noopener">
            dev.twitch.tv/console/apps
          </a>{' '}
          with OAuth Redirect URL <code>{location.origin + location.pathname}</code> and Client Type "Public".
        </div>
        {status === 'error' && error && <div className="status-msg error">{error}</div>}
      </div>
    </div>
  );
}
