import { useState } from 'react';
import type { Clip, Playlist } from '../types';
import { ClipTile } from './ClipTile';

interface PlaylistPanelProps {
  playlists: Playlist[];
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string) => void;
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  removeClipFromPlaylist: (id: string, slug: string) => void;
  activeClip: Clip | null;
  onPlay: (clip: Clip) => void;
  addError: string | null;
}

export function PlaylistPanel({
  playlists,
  activePlaylistId,
  setActivePlaylistId,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  removeClipFromPlaylist,
  activeClip,
  onPlay,
  addError,
}: PlaylistPanelProps) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null;

  function submitNewList() {
    const name = newName.trim();
    setCreatingNew(false);
    setNewName('');
    if (!name) return;
    createPlaylist(name);
  }

  function submitRename() {
    setRenaming(false);
    if (activePlaylist) renamePlaylist(activePlaylist.id, renameValue);
  }

  const sortedClips = activePlaylist
    ? [...activePlaylist.clips].sort((a, b) =>
        sortBy === 'views'
          ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
          : (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )
    : [];

  return (
    <div className="playlist-panel">
      <div className="playlist-tabs">
        {playlists.map((p) => (
          <button
            key={p.id}
            className={'playlist-tab' + (p.id === activePlaylistId ? ' active' : '')}
            onClick={() => setActivePlaylistId(p.id)}
          >
            {p.name}
          </button>
        ))}
        {creatingNew ? (
          <input
            className="playlist-new-input"
            autoFocus
            type="text"
            placeholder="List name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNewList();
              if (e.key === 'Escape') {
                setCreatingNew(false);
                setNewName('');
              }
            }}
            onBlur={submitNewList}
          />
        ) : (
          <button className="playlist-tab playlist-tab-new" onClick={() => setCreatingNew(true)}>
            + New
          </button>
        )}
      </div>

      {addError && <div className="status-msg error">{addError}</div>}

      {!activePlaylist ? (
        <div className="playlist-empty">No lists yet — create one to start saving clips.</div>
      ) : (
        <>
          <div className="playlist-header">
            {renaming ? (
              <input
                className="playlist-rename-input"
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                onBlur={submitRename}
              />
            ) : (
              <div
                className="playlist-name"
                onClick={() => {
                  setRenameValue(activePlaylist.name);
                  setRenaming(true);
                }}
                title="Click to rename"
              >
                {activePlaylist.name}
              </div>
            )}
            <button className="playlist-delete" title="Delete list" onClick={() => deletePlaylist(activePlaylist.id)}>
              Delete
            </button>
          </div>

          <div className="playlist-sort">
            <button
              className={'playlist-sort-btn' + (sortBy === 'date' ? ' active' : '')}
              onClick={() => setSortBy('date')}
            >
              Date
            </button>
            <button
              className={'playlist-sort-btn' + (sortBy === 'views' ? ' active' : '')}
              onClick={() => setSortBy('views')}
            >
              Views
            </button>
          </div>

          {sortedClips.length === 0 ? (
            <div className="playlist-empty">This list is empty.</div>
          ) : (
            <div className="clip-grid playlist-grid">
              {sortedClips.map((clip) => (
                <ClipTile
                  key={clip.slug}
                  clip={clip}
                  isPlaying={activeClip?.slug === clip.slug}
                  onPlay={() => onPlay(clip)}
                  onRemove={() => removeClipFromPlaylist(activePlaylist.id, clip.slug)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
