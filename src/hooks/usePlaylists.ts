import { useEffect, useState } from 'react';
import type { Clip, Playlist } from '../types';

const STORAGE_KEY = 'twitch_playlists';

interface StoredState {
  playlists: Playlist[];
  activePlaylistId: string | null;
}

function loadInitial(): StoredState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { playlists: [], activePlaylistId: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.playlists)) return { playlists: [], activePlaylistId: null };
    return { playlists: parsed.playlists, activePlaylistId: parsed.activePlaylistId ?? null };
  } catch {
    return { playlists: [], activePlaylistId: null };
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadInitial().playlists);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => loadInitial().activePlaylistId);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ playlists, activePlaylistId }));
  }, [playlists, activePlaylistId]);

  function createPlaylist(name: string) {
    const trimmed = name.trim() || 'Untitled list';
    const playlist: Playlist = { id: crypto.randomUUID(), name: trimmed, clips: [] };
    setPlaylists((prev) => [...prev, playlist]);
    setActivePlaylistId(playlist.id);
    return playlist.id;
  }

  function renamePlaylist(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
  }

  function deletePlaylist(id: string) {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActivePlaylistId((current) => (current === id ? (next[0]?.id ?? null) : current));
      return next;
    });
  }

  function addClipToPlaylist(id: string, clip: Clip) {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (p.clips.some((c) => c.slug === clip.slug)) return p;
        return { ...p, clips: [...p.clips, clip] };
      }),
    );
  }

  function removeClipFromPlaylist(id: string, slug: string) {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, clips: p.clips.filter((c) => c.slug !== slug) } : p)),
    );
  }

  return {
    playlists,
    activePlaylistId,
    setActivePlaylistId,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addClipToPlaylist,
    removeClipFromPlaylist,
  };
}
