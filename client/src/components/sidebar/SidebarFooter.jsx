import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import { LogOutIcon } from '../icons';

export default function SidebarFooter({ onProfileEdit }) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="sidebar-footer">
      <div className="sidebar-footer-user" onClick={onProfileEdit}>
        <Avatar
          name={currentUser.display_name}
          color={currentUser.avatar_color}
          size={32}
        />
        <span className="sidebar-footer-name">{currentUser.display_name}</span>
      </div>
      <button className="icon-btn" onClick={logout} title="로그아웃">
        <LogOutIcon size={18} />
      </button>
    </div>
  );
}
