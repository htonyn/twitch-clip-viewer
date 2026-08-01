import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project sites serve from /<repo-name>/, not the domain root.
  // Only applied to production builds so the dev server stays at "/" (matching
  // the Twitch app's registered http://localhost:5173/ redirect URI).
  base: command === 'build' ? '/twitch-clip-viewer/' : '/',
  build: {
    // GitHub Pages' "Deploy from a branch" mode only offers "/ (root)" or "/docs" as the
    // serving folder — "dist" isn't selectable — so build straight into docs/.
    outDir: 'docs',
  },
}))
