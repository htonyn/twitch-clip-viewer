// Twitch Client IDs are not secret — they're sent in the Client-Id header on every API request
// and are visible in any browser's network tab regardless of where they're stored. Only a
// Client Secret would need to stay private, and this app (Client Type: Public, Implicit Grant)
// never has one.
export const TWITCH_CLIENT_ID = 'oeeh2sirhyktz8etq0j0clh9t885xt';
