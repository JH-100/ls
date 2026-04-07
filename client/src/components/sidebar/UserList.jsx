import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import StatusDot from '../common/StatusDot';

export default function UserList() {
  const { currentUser } = useAuth();
  const { allUsers, createDm } = useChannels();

  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <ul className="channel-list">
      {otherUsers.map((user) => (
        <li
          key={user.id}
          className="channel-item"
          onClick={() => createDm(user.id)}
        >
          <StatusDot status={user.status} />
          <span className="channel-name">{user.display_name}</span>
        </li>
      ))}
    </ul>
  );
}
