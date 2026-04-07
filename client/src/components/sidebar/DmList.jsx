import { useChannels } from '../../contexts/ChannelContext';
import { UsersIcon } from '../icons';
import StatusDot from '../common/StatusDot';
import Badge from '../common/Badge';

export default function DmList() {
  const { channels, activeChannelId, selectChannel } = useChannels();

  return (
    <ul className="nav-list">
      {channels.filter(ch => ch.is_dm === 1 || ch.is_dm === 2).map(ch => (
        <li
          key={ch.id}
          className={activeChannelId === ch.id ? 'active' : ''}
          onClick={() => selectChannel(ch.id)}
        >
          {ch.is_dm === 1 ? (
            <>
              <StatusDot status={ch.dmUser?.status} />
              {ch.dmUser?.display_name || 'Unknown'}
            </>
          ) : (
            <>
              <span className="channel-icon"><UsersIcon size={18} /></span>
              {ch.name}
            </>
          )}
          <Badge count={ch.unread_count} />
        </li>
      ))}
    </ul>
  );
}
