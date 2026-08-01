import { useEffect, useRef, useState } from 'react';
import type { TwitchAuthStatus } from '../hooks/useTwitchAuth';

interface HeaderProps {
  status: TwitchAuthStatus;
  displayName: string | null;
  profileImageUrl: string | null;
  disconnect: () => void;
}

export function Header({ status, displayName, profileImageUrl, disconnect }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <header>
      <div className="brand">
        <h1>
          Twitch Clip <span>Portal</span>
        </h1>
      </div>

      {status === 'signed-in' ? (
        <div className="avatar-menu" ref={menuRef}>
          <button className="avatar-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" />
            ) : (
              <span className="avatar-fallback">{displayName?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </button>
          {menuOpen && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-name">{displayName}</div>
              <button
                className="primary"
                onClick={() => {
                  setMenuOpen(false);
                  disconnect();
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="frame-count mono">{status === 'connecting' ? 'Connecting…' : 'Not connected'}</div>
      )}
    </header>
  );
}
