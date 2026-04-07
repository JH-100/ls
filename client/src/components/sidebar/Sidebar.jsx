import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MoonIcon, SunIcon, PlusIcon } from '../icons';
import ChannelList from './ChannelList';
import DmList from './DmList';
import UserList from './UserList';
import SidebarFooter from './SidebarFooter';

export default function Sidebar({ onCreateChannel, onStartDm, onProfileEdit }) {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>LikeSlack</h2>
        <button className="icon-btn" onClick={toggleTheme} title="테마 변경">
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>채널</span>
            <button className="icon-btn" onClick={onCreateChannel} title="채널 만들기">
              <PlusIcon size={16} />
            </button>
          </div>
          <ChannelList />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>다이렉트 메시지</span>
            <button className="icon-btn" onClick={onStartDm} title="새 메시지">
              <PlusIcon size={16} />
            </button>
          </div>
          <DmList />
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>사용자</span>
          </div>
          <UserList />
        </div>
      </div>

      <SidebarFooter onProfileEdit={onProfileEdit} />
    </aside>
  );
}
