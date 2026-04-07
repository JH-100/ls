import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import { LogOutIcon } from '../icons';

export default function SidebarFooter({ onProfileEdit }) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const name = currentUser.displayName || currentUser.display_name || currentUser.username;
  const color = currentUser.avatarColor || currentUser.avatar_color;
  const url = currentUser.avatarUrl || currentUser.avatar_url;

  return (
    <div className="sidebar-footer">
      <div className="current-user" onClick={onProfileEdit}>
        <Avatar name={name} color={color} url={url} size={32} />
        <span>{name}</span>
      </div>
      <button className="icon-btn" onClick={logout} title="로그아웃">
        <LogOutIcon size={18} />
      </button>
    </div>
  );
}
