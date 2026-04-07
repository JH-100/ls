import { UserPlusIcon, SearchIcon, MembersIcon, HashIcon, UsersIcon } from '../icons';

export default function ChannelHeader({ channel, onInvite, onToggleSearch, onToggleMembers }) {
  const renderChannelName = () => {
    if (channel.is_dm === 1) {
      return <span className="channel-header-name">{channel.display_name}</span>;
    }
    if (channel.is_dm === 2) {
      return (
        <span className="channel-header-name">
          <UsersIcon size={18} /> {channel.name}
        </span>
      );
    }
    return (
      <span className="channel-header-name">
        <HashIcon size={18} /> {channel.name}
      </span>
    );
  };

  return (
    <div className="channel-header">
      <div className="channel-header-info">{renderChannelName()}</div>
      <div className="channel-header-actions">
        {channel.is_dm === 0 && (
          <button className="icon-btn" onClick={onInvite} title="멤버 초대">
            <UserPlusIcon size={18} />
          </button>
        )}
        <button className="icon-btn" onClick={onToggleSearch} title="검색">
          <SearchIcon size={18} />
        </button>
        <button className="icon-btn" onClick={onToggleMembers} title="멤버 목록">
          <MembersIcon size={18} />
        </button>
      </div>
    </div>
  );
}
