import { useTwitchAuth } from './hooks/useTwitchAuth';
import { Header } from './components/Header';
import { TwitchAuth } from './components/TwitchAuth';
import { ChannelSearch } from './components/ChannelSearch';
import { Loading } from './components/Loading';

export default function App() {
  const { status, clientId, accessToken, displayName, profileImageUrl, error, connect, disconnect } = useTwitchAuth();

  return (
    <>
      <Header status={status} displayName={displayName} profileImageUrl={profileImageUrl} disconnect={disconnect} />
      <main className="stage">
        {status === 'connecting' ? (
          <Loading />
        ) : status === 'signed-in' && accessToken ? (
          <ChannelSearch clientId={clientId} accessToken={accessToken} />
        ) : (
          <TwitchAuth status={status} error={error} connect={connect} />
        )}
      </main>
    </>
  );
}
