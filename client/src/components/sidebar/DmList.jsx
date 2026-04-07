import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import { UsersIcon, XIcon } from '../icons';
import StatusDot from '../common/StatusDot';
import Badge from '../common/Badge';
import { apiCall } from '../../api';

export default function DmList() {
  const { currentUser } = useAuth();
  const { channels, activeChannelId, allUsers, selectChannel, loadChannels, createDm } = useChannels();

  const dmChannels = channels.filter(ch => ch.is_dm === 1 || ch.is_dm === 2);

  // Users who already have a DM channel
  const dmUserIds = useMemo(() => {
    const ids = new Set();
    dmChannels.filter(ch => ch.is_dm === 1).forEach(ch => {
      if (ch.dmUser?.id) ids.add(ch.dmUser.id);
    });
    return ids;
  }, [dmChannels]);

  // Users without a DM yet
  const noDmUsers = useMemo(
    () => allUsers.filter(u => u.id !== currentUser?.id && !dmUserIds.has(u.id)),
    [allUsers, currentUser?.id, dmUserIds]
  );

  const handleLeave = async (e, channelId) => {
    e.stopPropagation();
    try {
      await apiCall(`/api/channels/${channelId}/leave`, { method: 'POST' });
      await loadChannels(true);
      if (activeChannelId === channelId) selectChannel(null);
    } catch {}
  };

  const handleStartDm = async (userId) => {
    try {
      const channel = await createDm(userId);
      if (channel?.id) selectChannel(channel.id);
    } catch {}
  };

  return (
    <ul className="nav-list">
      {/* Existing DM/group channels */}
      {dmChannels.map(ch => (
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
          >
            <XIcon size={14} />
          </button>
        </li>
      ))}

      {/* Users without DM yet */}
      {noDmUsers.map(user => (
        <li
          key={user.id}
          onClick={() => handleStartDm(user.id)}
          style={{ opacity: 0.6 }}
        >
          <StatusDot status={user.status} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.display_name}
          </span>
        </li>
      ))}
    </ul>
  );
}
