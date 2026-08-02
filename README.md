# Twitch Clip Portal

A static, no-backend Twitch clip viewer. Sign in with Twitch, search any channel's clips, look up a specific clip by ID/URL/title, and build session-only playlists — all running entirely in the browser, with no server component of its own (the Twitch Helix API is called directly, authenticated via OAuth Implicit Grant).

## Features

- **Sign in with Twitch** — no account/password of your own, no backend holding a client secret.
- **Channel search** — pulls a channel's genuinely recent clips (not just all-time top-viewed, which is what Twitch's API returns by default).
- **Clip lookup** — paste a clip ID, a `clips.twitch.tv/...` URL, or search by title (title search runs against a full background-indexed catalog of the channel's clips, not just the visible list).
- **Category filter** — filter the current results by game/category.
- **Playlists** — create multiple named lists, add/remove clips, sort by date or views. Session-only: playlists and your sign-in both clear when you close the tab.
- **Channel details** — avatar, bio, broadcaster type, member-since year.

There is deliberately no in-app clip download — see `CLAUDE.md` for why.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173/)
npm run build    # type-check and produce a production build (outputs to docs/)
npm run preview  # serve the production build locally
npm run lint      # run oxlint
```

There is no test suite.

### Twitch app setup

This app calls the Twitch Helix API directly from the browser, so it needs its own Twitch application:

1. Register an app at the [Twitch Developer Console](https://dev.twitch.tv/console/apps) with **Client Type: Public**.
2. Add an **OAuth Redirect URL** matching wherever you serve the app (e.g. `http://localhost:5173/` for local dev).
3. Put the app's Client ID in `src/config.ts` (`TWITCH_CLIENT_ID`). Client IDs aren't secret, so committing it is fine — this app never uses a Client Secret.

## Deployment

Deployed as a GitHub Pages project site. `npm run build` outputs straight into `docs/`, which is committed and configured as the Pages source. See `CLAUDE.md` for the full deployment mechanics (base path handling, redirect URL registration, etc.).

## Architecture

See `CLAUDE.md` for a detailed breakdown of the app's structure, data flow, and the reasoning behind non-obvious decisions.
