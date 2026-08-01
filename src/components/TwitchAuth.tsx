import type { TwitchAuthStatus } from '../hooks/useTwitchAuth';

interface TwitchAuthProps {
  status: TwitchAuthStatus;
  error: string | null;
  connect: () => void;
}

export function TwitchAuth({ status, error, connect }: TwitchAuthProps) {
  if (status === 'signed-in') return null;

  return (
    <div className="input-card">
      <div className="tab-panel active">
        <button className="primary" disabled={status === 'connecting'} onClick={connect}>
          {status === 'connecting' ? 'Connecting…' : 'Connect with Twitch'}
        </button>
        {status === 'error' && error && <div className="status-msg error">{error}</div>}
      </div>
    </div>
  );
}
