const AUTHORIZE_URL = 'https://id.twitch.tv/oauth2/authorize';

function redirectUri(): string {
  return `${location.origin}${location.pathname}`;
}

export function buildAuthorizeUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'token',
    scope: '',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface AuthResponse {
  accessToken?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}

export function parseAuthResponse(hash: string): AuthResponse | null {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!trimmed) return null;
  const params = new URLSearchParams(trimmed);
  if (!params.has('access_token') && !params.has('error')) return null;
  return {
    accessToken: params.get('access_token') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}
