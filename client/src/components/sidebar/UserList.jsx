import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import StatusDot from '../common/StatusDot';

export default function UserList() {
  const { currentUser } = useAuth();
  const { allUsers, createDm, selectChannel } = useChannels();

  const handleClick = async (userId) => {
    const channel = await createDm(userId);
    if (channel?.id) selectChannel(channel.id);
  };

  return (
    <ul className="nav-list user-list">
      {allUsers.filter(u => u.id !== currentUser?.id).map(user => (
        <li key={user.id} onClick={() => handleClick(user.id)}>
          <StatusDot status={user.status} />
          {user.display_name}
        </li>
      ))}
    </ul>
  );
}
