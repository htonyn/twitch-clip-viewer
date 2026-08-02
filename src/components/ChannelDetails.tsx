import type { ChannelInfo } from '../types';

interface ChannelDetailsProps {
  info: ChannelInfo;
  indexingClips: boolean;
  indexedCount: number;
}

export function ChannelDetails({ info, indexingClips, indexedCount }: ChannelDetailsProps) {
  const memberSince = new Date(info.createdAt).getFullYear();

  return (
    <div className="channel-details">
      {info.profileImageUrl ? (
        <img className="channel-details-avatar" src={info.profileImageUrl} alt="" />
      ) : (
        <div className="channel-details-avatar channel-details-avatar-fallback">{info.displayName[0]?.toUpperCase()}</div>
      )}
      <div className="channel-details-info">
        <div className="channel-details-name">
          <a href={`https://www.twitch.tv/${info.login}`} target="_blank" rel="noopener">
            {info.displayName}
          </a>
          {info.broadcasterType && <span className="channel-details-badge">{info.broadcasterType}</span>}
        </div>
        {info.description && <div className="channel-details-bio">{info.description}</div>}
        <div className="channel-details-stats">
          {!isNaN(memberSince) && <span>Channel since {memberSince}</span>}
          {indexedCount > 0 && (
            <span>
              {indexedCount.toLocaleString()} clip{indexedCount === 1 ? '' : 's'} loaded{indexingClips ? '…' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
