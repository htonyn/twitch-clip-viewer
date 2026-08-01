import { useEffect, useState } from 'react';
import { TWITCH_CLIENT_ID } from '../config';
import { buildAuthorizeUrl, parseAuthResponse } from '../lib/oauth';
import { fetchAuthenticatedUser } from '../lib/twitch';

const ACCESS_TOKEN_KEY = 'twitch_access_token';
const STATE_KEY = 'twitch_oauth_state';

export type TwitchAuthStatus = 'signed-out' | 'connecting' | 'signed-in' | 'error';

export function useTwitchAuth() {
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(ACCESS_TOKEN_KEY));
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Start "verifying" immediately if there's a stored token (page refresh) or an incoming
  // redirect from Twitch (hash has access_token) — otherwise the sign-in form flashes for a
  // tick before the token-check effects below have had a chance to run.
  const [verifying, setVerifying] = useState(
    () => Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY)) || location.hash.includes('access_token'),
  );

  // Handle the redirect back from Twitch (access token or error arrives in the URL fragment).
  useEffect(() => {
    const parsed = parseAuthResponse(location.hash);
    if (!parsed) return;
    history.replaceState(null, '', location.pathname + location.search);

    if (parsed.error) {
      setError(parsed.errorDescription || parsed.error);
      return;
    }
    if (parsed.accessToken) {
      const expectedState = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);
      if (!parsed.state || parsed.state !== expectedState) {
        setError('Login response failed verification (state mismatch) — please try connecting again.');
        return;
      }
      sessionStorage.setItem(ACCESS_TOKEN_KEY, parsed.accessToken);
      setAccessToken(parsed.accessToken);
      setError(null);
    }
  }, []);

  // Confirm the token actually works and fetch a display name for it.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setVerifying(true);
    fetchAuthenticatedUser(TWITCH_CLIENT_ID, accessToken)
      .then((user) => {
        if (cancelled) return;
        setDisplayName(user.display_name);
        setProfileImageUrl(user.profile_image_url);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        setAccessToken(null);
        setProfileImageUrl(null);
        setError('That token is no longer valid — please connect again.');
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function connect() {
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    location.href = buildAuthorizeUrl(TWITCH_CLIENT_ID, state);
  }

  function disconnect() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    setAccessToken(null);
    setDisplayName(null);
    setProfileImageUrl(null);
    setError(null);
  }

  let status: TwitchAuthStatus = 'signed-out';
  if (error) status = 'error';
  else if (accessToken && displayName) status = 'signed-in';
  else if (accessToken && verifying) status = 'connecting';

  return { status, clientId: TWITCH_CLIENT_ID, accessToken, displayName, profileImageUrl, error, connect, disconnect };
}
