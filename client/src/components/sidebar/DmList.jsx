import { useChannels } from '../../contexts/ChannelContext';
import { UsersIcon } from '../icons';
import StatusDot from '../common/StatusDot';
import Badge from '../common/Badge';

export default function DmList() {
  const { channels, currentChannel, selectChannel } = useChannels();

  const dmItems = channels.filter((ch) => ch.is_dm === 1 || ch.is_dm === 2);

  return (
    <ul className="channel-list">
      {dmItems.map((ch) => (
        <li
          key={ch.id}
          className={`channel-item ${currentChannel?.id === ch.id ? 'active' : ''}`}
          onClick={() => selectChannel(ch.id)}
        >
          {ch.is_dm === 1 ? (
            <>
              <StatusDot status={ch.status} />
              <span className="channel-name">{ch.display_name}</span>
            </>
          ) : (
            <>
              <UsersIcon size={16} />
              <span className="channel-name">{ch.name}</span>
            </>
          )}
          <Badge count={ch.unread_count} />
        </li>
      ))}
    </ul>
  );
}
