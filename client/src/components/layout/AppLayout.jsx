import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChannels } from '../../contexts/ChannelContext';
import { useMessages } from '../../contexts/MessageContext';
import { useSocket } from '../../contexts/SocketContext';
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
  const { currentChannel, loadChannelMessages } = useChannels();
  const { activeThreadId, closeThread } = useMessages();
  const socket = useSocket();

  const [showSearch, setShowSearch] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showStartDm, setShowStartDm] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Version polling for auto-update
  useEffect(() => {
    const checkVersion = async () => {
      try {
        await apiCall('/api/version');
      } catch {
        // ignore
      }
    };
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  // Visibility change - reload channel on focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && currentChannel) {
        loadChannelMessages(currentChannel.id);
      }
    };

    const handleFocus = () => {
      if (currentChannel) {
        loadChannelMessages(currentChannel.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentChannel, loadChannelMessages]);

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const toggleMembers = useCallback(() => {
    setShowMembers((prev) => !prev);
    if (activeThreadId) closeThread();
  }, [activeThreadId, closeThread]);

  const rightPanel = activeThreadId ? (
    <ThreadPanel />
  ) : showMembers && currentChannel ? (
    <MembersPanel channelId={currentChannel.id} onClose={() => setShowMembers(false)} />
  ) : null;

  return (
    <div className="app-container">
      <NotificationBanner />

      <Sidebar
        onCreateChannel={() => setShowCreateChannel(true)}
        onStartDm={() => setShowStartDm(true)}
        onProfileEdit={() => setShowProfileEdit(true)}
      />

      <main className="main-content">
        {currentChannel ? (
          <>
            <ChannelHeader
              channel={currentChannel}
              onInvite={() => setShowInviteMembers(true)}
              onToggleSearch={toggleSearch}
              onToggleMembers={toggleMembers}
            />
            {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
            <MessageList />
            <TypingIndicator />
            <MessageInput />
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {rightPanel && <aside className="right-panel">{rightPanel}</aside>}

      {showCreateChannel && (
        <CreateChannelModal onClose={() => setShowCreateChannel(false)} />
      )}
      {showStartDm && (
        <StartDmModal onClose={() => setShowStartDm(false)} />
      )}
      {showInviteMembers && currentChannel && (
        <InviteMembersModal
          channelId={currentChannel.id}
          onClose={() => setShowInviteMembers(false)}
        />
      )}
      {showProfileEdit && (
        <ProfileEditModal onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  );
}
