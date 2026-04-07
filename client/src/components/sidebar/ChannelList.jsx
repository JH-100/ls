import { useChannels } from '../../contexts/ChannelContext';
import { HashIcon } from '../icons';
import Badge from '../common/Badge';

export default function ChannelList() {
  const { channels, activeChannelId, selectChannel } = useChannels();

  return (
    <ul className="nav-list">
      {channels.filter(ch => ch.is_dm === 0).map(ch => (
        <li
          key={ch.id}
          className={activeChannelId === ch.id ? 'active' : ''}
          onClick={() => selectChannel(ch.id)}
        >
          <span className="channel-icon"><HashIcon size={18} /></span>
          {ch.name}
          <Badge count={ch.unread_count} />
        </li>
      ))}
    </ul>
  );
}
