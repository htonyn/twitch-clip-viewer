import { useState } from 'react';
import type { Clip } from '../types';
import { PasteTab } from './PasteTab';
import { BrowseTab } from './BrowseTab';

interface InputPanelProps {
  playingIndex: number;
  addClips: (clips: Clip[]) => { addedCount: number; firstNewIndex: number };
  play: (index: number) => void;
}

export function InputPanel({ playingIndex, addClips, play }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'browse'>('paste');
  const [clientId, setClientId] = useState('');
  const [oauthToken, setOauthToken] = useState('');

  return (
    <div className="input-card">
      <div className="tabs">
        <button
          className={'tab-btn' + (activeTab === 'paste' ? ' active' : '')}
          onClick={() => setActiveTab('paste')}
        >
          Paste Clips
        </button>
        <button
          className={'tab-btn' + (activeTab === 'browse' ? ' active' : '')}
          onClick={() => setActiveTab('browse')}
        >
          Browse Channel
        </button>
      </div>

      <PasteTab
        active={activeTab === 'paste'}
        clientId={clientId}
        oauthToken={oauthToken}
        playingIndex={playingIndex}
        addClips={addClips}
        play={play}
      />
      <BrowseTab
        active={activeTab === 'browse'}
        clientId={clientId}
        setClientId={setClientId}
        oauthToken={oauthToken}
        setOauthToken={setOauthToken}
        addClips={addClips}
      />
    </div>
  );
}
