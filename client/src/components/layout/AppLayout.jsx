import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import { useMessages } from '../../contexts/MessageContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../hooks/useNotification';
import { apiCall } from '../../api';
import Sidebar from '../sidebar/Sidebar';
import ChannelHeader from '../chat/ChannelHeader';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import EmptyState from '../chat/EmptyState';
import SearchBar from '../chat/SearchBar';
import TypingIndicator from '../chat/TypingIndicator';
import ThreadPanel from '../thread/ThreadPanel';
import MembersPanel from '../members/MembersPanel';
import NotificationBanner from '../common/NotificationBanner';
import CreateChannelModal from '../modals/CreateChannelModal';
import StartDmModal from '../modals/StartDmModal';
import InviteMembersModal from '../modals/InviteMembersModal';
import ProfileEditModal from '../modals/ProfileEditModal';

export default function AppLayout() {
  const { currentUser } = useAuth();
  const { channels, activeChannelId, loadChannels, selectChannel } = useChannels();
  const { messages, lastReadAt, loadMessages, activeThreadId, closeThread } = useMessages();
  const { socketRef, connected, markRead } = useSocket();

  const [showSearch, setShowSearch] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [modal, setModal] = useState(null); // 'createChannel' | 'startDm' | 'invite' | 'profile' | null
  const appVersionRef = useRef(null);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Initial channel load
  useEffect(() => {
    loadChannels(false);
  }, []);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeChannelId) {
      loadMessages(activeChannelId);
      markRead({ channelId: activeChannelId });
    }
  }, [activeChannelId]);

  // Version polling for auto-update
  useEffect(() => {
    const check = async () => {
      try {
        const data = await apiCall('/api/version');
        if (appVersionRef.current && data.version !== appVersionRef.current) {
          const lastReload = sessionStorage.getItem('ls-reload-ver');
          if (lastReload !== data.version) {
            sessionStorage.setItem('ls-reload-ver', data.version);
            window.location.reload();
            return;
          }
        }
        appVersionRef.current = data.version;
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload on focus/visibility
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && activeChannelId) {
        loadMessages(activeChannelId);
        if (navigator.clearAppBadge) navigator.clearAppBadge();
      }
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
    };
  }, [activeChannelId]);

  // Badge notification (taskbar + title)
  const { notify, clearBadge } = useNotification();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewMsg = (msg) => {
      if (msg.user_id === currentUser?.id) return;
      const isViewing = msg.channel_id === activeChannelId && document.visibilityState === 'visible';
      if (isViewing) return;
      notify();
    };

    socket.on('new-message', handleNewMsg);
    return () => socket.off('new-message', handleNewMsg);
  }, [connected, activeChannelId, currentUser?.id, selectChannel, notify]);

  // Channel name display
  let channelDisplayName = '';
  if (activeChannel) {
    if (activeChannel.is_dm === 1) channelDisplayName = activeChannel.dmUser?.display_name || 'DM';
    else if (activeChannel.is_dm === 2) channelDisplayName = activeChannel.name;
    else channelDisplayName = `# ${activeChannel.name}`;
  }

  return (
    <>
    <NotificationBanner />
    <div className="app">
      <Sidebar
        onCreateChannel={() => setModal('createChannel')}
        onStartDm={() => setModal('startDm')}
        onProfileEdit={() => setModal('profile')}
      />

      <main className="main-content">
        {activeChannel ? (
          <>
            <ChannelHeader
              name={channelDisplayName}
              description={activeChannel.description}
              onInvite={() => setModal('invite')}
              onToggleSearch={() => setShowSearch(s => !s)}
              onToggleMembers={() => setShowMembers(s => !s)}
            />
            {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
            <MessageList
              messages={messages}
              currentUserId={currentUser?.id}
              lastReadAt={lastReadAt}
            />
            <TypingIndicator channelId={activeChannelId} />
            <MessageInput channelId={activeChannelId} />
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {activeThreadId && <ThreadPanel />}
      {showMembers && activeChannelId && !activeThreadId && (
        <MembersPanel channelId={activeChannelId} onClose={() => setShowMembers(false)} />
      )}

      {modal === 'createChannel' && <CreateChannelModal onClose={() => setModal(null)} />}
      {modal === 'startDm' && <StartDmModal onClose={() => setModal(null)} />}
      {modal === 'invite' && activeChannelId && <InviteMembersModal channelId={activeChannelId} onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileEditModal onClose={() => setModal(null)} />}
    </div>
    </>
  );
}
