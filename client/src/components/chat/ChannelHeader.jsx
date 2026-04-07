import { UserPlusIcon, SearchIcon, MembersIcon } from '../icons';

export default function ChannelHeader({ name, description, onInvite, onToggleSearch, onToggleMembers }) {
  return (
    <div className="channel-header">
      <div className="channel-info">
        <h3>{name}</h3>
        {description && <span className="channel-desc">{description}</span>}
      </div>
      <div className="channel-actions">
        <button className="icon-btn" onClick={onInvite} title="멤버 초대">
          <UserPlusIcon size={18} />
        </button>
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
