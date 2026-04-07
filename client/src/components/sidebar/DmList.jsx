import { useChannels } from '../../contexts/ChannelContext';
import { UsersIcon, XIcon } from '../icons';
import StatusDot from '../common/StatusDot';
import Badge from '../common/Badge';
import { apiCall } from '../../api';

export default function DmList() {
  const { channels, activeChannelId, selectChannel, loadChannels } = useChannels();

  const handleLeave = async (e, channelId) => {
    e.stopPropagation();
    try {
      await apiCall(`/api/channels/${channelId}/leave`, { method: 'POST' });
      await loadChannels(true);
      if (activeChannelId === channelId) selectChannel(null);
    } catch {}
  };

  return (
    <ul className="nav-list">
      {channels.filter(ch => ch.is_dm === 1 || ch.is_dm === 2).map(ch => (
        <li
          key={ch.id}
          className={activeChannelId === ch.id ? 'active' : ''}
          onClick={() => selectChannel(ch.id)}
          style={{ position: 'relative' }}
        >
          {ch.is_dm === 1 ? (
            <>
              <StatusDot status={ch.dmUser?.status} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ch.dmUser?.display_name || 'Unknown'}
              </span>
            </>
          ) : (
            <>
              <span className="channel-icon"><UsersIcon size={18} /></span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ch.name}
              </span>
            </>
          )}
          <Badge count={ch.unread_count} />
          <button
            className="icon-btn small"
            onClick={(e) => handleLeave(e, ch.id)}
            title="대화 나가기"
            style={{ opacity: 0, transition: 'opacity 0.15s', padding: 2 }}
            onMouseOver={e => e.currentTarget.style.opacity = 1}
          >
            <XIcon size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
