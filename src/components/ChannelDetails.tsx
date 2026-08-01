import type { ChannelInfo } from '../types';

interface ChannelDetailsProps {
  info: ChannelInfo;
}

export function ChannelDetails({ info }: ChannelDetailsProps) {
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
        {!isNaN(memberSince) && (
          <div className="channel-details-stats">
            <span>Channel since {memberSince}</span>
          </div>
        )}
      </div>
    </div>
  );
}
