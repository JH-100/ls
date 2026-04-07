import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChannelProvider } from './contexts/ChannelContext';
import { MessageProvider } from './contexts/MessageContext';
import AppLayout from './components/layout/AppLayout';

export default function AuthenticatedApp() {
  const { currentUser } = useAuth();

  return (
    <SocketProvider user={currentUser}>
      <ChannelProvider>
        <MessageProvider>
          <AppLayout />
        </MessageProvider>
      </ChannelProvider>
    </SocketProvider>
  );
}
