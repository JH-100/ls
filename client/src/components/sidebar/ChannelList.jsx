import { useChannels } from '../../contexts/ChannelContext';
import { HashIcon } from '../icons';
import Badge from '../common/Badge';

export default function ChannelList() {
  const { channels, currentChannel, selectChannel } = useChannels();

  const channelItems = channels.filter((ch) => ch.is_dm === 0);

  return (
    <ul className="channel-list">
      {channelItems.map((ch) => (
        <li
          key={ch.id}
          className={`channel-item ${currentChannel?.id === ch.id ? 'active' : ''}`}
          onClick={() => selectChannel(ch.id)}
        >
          <HashIcon size={16} />
          <span className="channel-name">{ch.name}</span>
          <Badge count={ch.unread_count} />
        </li>
      ))}
    </ul>
  );
}
