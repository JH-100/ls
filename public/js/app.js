// Main application logic
(async function () {
  // Check auth
  let currentUser;
  try {
    currentUser = await apiCall('/api/auth/me');
  } catch {
    window.location.href = '/login.html';
    return;
  }

  // State
  let channels = [];
  let activeChannelId = null;
  let allUsers = [];
  let pendingFile = null;
  let activeThreadId = null;
  let typingTimers = {};
  let appVersion = null;

  // Auto-update: check version periodically
  async function checkForUpdates() {
    try {
      const data = await apiCall('/api/version');
      if (appVersion && data.version !== appVersion) {
        // Prevent reload loop: only reload once per version change
        const lastReload = sessionStorage.getItem('ls-reload-ver');
        if (lastReload === data.version) return;
        sessionStorage.setItem('ls-reload-ver', data.version);
        console.log('[Update] New version detected, reloading...');
        window.location.reload();
        return;
      }
      appVersion = data.version;
    } catch {}
  }
  await checkForUpdates();
  setInterval(checkForUpdates, 30000);

  // Initialize
  UI.renderCurrentUser(currentUser);
  socketClient.connect();
  initEmojiPicker(document.getElementById('emojiGrid'), onEmojiSelect);

  // Inject SVG icons into buttons
  function injectIcons() {
    const map = {
      'themeToggle': Icons.moon,
      'addChannelBtn': Icons.plus,
      'addDmBtn': Icons.plus,
      'logoutBtn': Icons.logOut,
      'inviteBtn': Icons.userPlus,
      'searchToggle': Icons.search,
      'membersToggle': Icons.members,
      'searchClose': Icons.x,
      'threadClose': Icons.x,
      'membersClose': Icons.x,
      'modalClose': Icons.x,
      'fileUploadBtn': Icons.paperclip,
      'emojiBtn': Icons.smile,
      'sendBtn': Icons.send,
      'threadSendBtn': Icons.send,
      'filePreviewRemove': Icons.x,
      'filePreviewIcon': Icons.file,
      'dropIcon': Icons.upload,
    };
    for (const [id, svg] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = svg;
    }
  }
  injectIcons();

  // Load channels
  await loadChannels();

  // Theme
  const savedTheme = localStorage.getItem('likeslack-theme') || 'dark';
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');

  // === Socket Events ===
  let unreadTotal = 0;

  socketClient.on('new-message', (msg) => {
    if (msg.channel_id === activeChannelId && !msg.parent_id && document.visibilityState === 'visible') {
      const container = document.getElementById('messagesList');
      container.appendChild(UI.renderMessage(msg, currentUser.id));
      scrollToBottom();
      socketClient.markRead(activeChannelId);
    }
    // Update unread badges + taskbar notification
    if (msg.user_id !== currentUser.id && (msg.channel_id !== activeChannelId || msg.parent_id || document.visibilityState !== 'visible')) {
      updateUnreadBadge(msg.channel_id);
      unreadTotal++;
      // Taskbar badge
      if (navigator.setAppBadge) navigator.setAppBadge(unreadTotal);
      // Desktop notification
      if (Notification.permission === 'granted') {
        const title = msg.display_name || 'LikeSlack';
        const body = msg.content || '새 파일이 전송되었습니다';
        const notif = new Notification(title, {
          body: body.length > 100 ? body.substring(0, 100) + '...' : body,
          icon: '/assets/icon-192.svg',
          tag: 'ls-' + msg.channel_id,
          silent: false,
        });
        notif.onclick = () => {
          window.focus();
          selectChannel(msg.channel_id);
          notif.close();
        };
      }
    }
    // If thread is open and message is a reply to active thread
    if (activeThreadId && msg.parent_id === activeThreadId) {
      const threadContainer = document.getElementById('threadMessages');
      threadContainer.appendChild(UI.renderMessage(msg, currentUser.id));
      threadContainer.scrollTop = threadContainer.scrollHeight;
    }
  });

  socketClient.on('message-edited', (msg) => {
    const el = document.querySelector(`[data-message-id="${msg.id}"]`);
    if (el) {
      const newEl = UI.renderMessage(msg, currentUser.id);
      el.replaceWith(newEl);
    }
  });

  socketClient.on('message-deleted', (data) => {
    const el = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (el) el.remove();
  });

  socketClient.on('reactions-updated', (data) => {
    const el = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (el) {
      // Re-fetch and re-render the reactions section
      let reactionsDiv = el.querySelector('.message-reactions');
      if (!reactionsDiv) {
        reactionsDiv = document.createElement('div');
        reactionsDiv.className = 'message-reactions';
        el.querySelector('.message-body').appendChild(reactionsDiv);
      }
      reactionsDiv.innerHTML = '';
      const grouped = {};
      data.reactions.forEach(r => {
        if (!grouped[r.emoji]) grouped[r.emoji] = [];
        grouped[r.emoji].push(r);
      });
      Object.entries(grouped).forEach(([emoji, users]) => {
        const btn = document.createElement('button');
        btn.className = 'reaction';
        if (users.some(u => u.user_id === currentUser.id)) btn.classList.add('mine');
        btn.innerHTML = `<span class="emoji">${emoji}</span><span class="count">${users.length}</span>`;
        btn.title = users.map(u => u.display_name).join(', ');
        btn.dataset.emoji = emoji;
        btn.dataset.messageId = data.messageId;
        reactionsDiv.appendChild(btn);
      });
      if (data.reactions.length === 0) reactionsDiv.remove();
    }
  });

  socketClient.on('thread-update', (data) => {
    const el = document.querySelector(`[data-message-id="${data.parentId}"]`);
    if (el) {
      let threadLink = el.querySelector('.thread-link');
      if (!threadLink) {
        threadLink = document.createElement('div');
        threadLink.className = 'thread-link';
        threadLink.dataset.parentId = data.parentId;
        el.querySelector('.message-body').appendChild(threadLink);
      }
      threadLink.textContent = `${data.replyCount}개의 답글`;
    }
  });

  socketClient.on('user-status', (data) => {
    UI.updateUserStatus(data.userId, data.status);
    // Update allUsers
    const user = allUsers.find(u => u.id === data.userId);
    if (user) user.status = data.status;
    UI.renderUserList(allUsers, currentUser.id);
  });

  socketClient.on('online-users', (onlineIds) => {
    allUsers.forEach(u => {
      u.status = onlineIds.includes(u.id) ? 'online' : 'offline';
    });
    UI.renderUserList(allUsers, currentUser.id);
  });

  socketClient.on('user-typing', (data) => {
    if (data.channelId !== activeChannelId) return;
    showTyping(data.displayName);
  });

  socketClient.on('unread-update', () => {
    loadChannels(true);
  });

  // Someone read messages in a channel — update read receipts live
  socketClient.on('channel-read', (data) => {
    if (data.channelId === activeChannelId) {
      // Update all my messages' read indicators
      document.querySelectorAll('.message').forEach(msgEl => {
        const readEl = msgEl.querySelector('.message-read');
        if (!readEl) return;
        // Re-calculate: bump read count display
        const text = readEl.textContent;
        if (text.includes('안 읽음')) {
          readEl.textContent = '\u2713 1명 읽음';
          readEl.className = 'message-read';
        } else if (text.includes('명 읽음')) {
          const match = text.match(/(\d+)명/);
          if (match) {
            const count = parseInt(match[1]) + 1;
            const totalMatch = readEl.dataset.total;
            if (totalMatch && count >= parseInt(totalMatch)) {
              readEl.textContent = '\u2713 모두 읽음';
              readEl.className = 'message-read read-all';
            } else {
              readEl.textContent = `\u2713 ${count}명 읽음`;
            }
          }
        }
      });
    }
    // Update sidebar unread badge — reload channel list
    loadChannels(true);
  });

  // === Functions ===
  async function loadChannels(keepActive = false) {
    channels = await apiCall('/api/channels');
    UI.renderChannelList(channels, activeChannelId);

    // Join all channel rooms
    channels.forEach(ch => socketClient.joinChannel(ch.id));

    // Load users
    socketClient.getUsers((users) => {
      allUsers = users;
      UI.renderUserList(users, currentUser.id);
    });

    // Auto-select first channel if none active
    if (!keepActive && !activeChannelId && channels.length > 0) {
      const general = channels.find(c => c.name === 'general');
      selectChannel(general ? general.id : channels[0].id);
    }
  }

  async function selectChannel(channelId) {
    activeChannelId = channelId;
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    // Update sidebar highlight
    UI.renderChannelList(channels, channelId);

    // Update header name
    let headerName = `# ${channel.name}`;
    if (channel.is_dm === 1) {
      headerName = channel.dmUser?.display_name || 'DM';
    } else if (channel.is_dm === 2) {
      headerName = '\ud83d\udc65 ' + channel.name;
    }
    document.getElementById('channelName').textContent = headerName;
    document.getElementById('channelDesc').textContent = channel.description || '';
    document.getElementById('messageInputArea').style.display = 'block';
    document.getElementById('emptyState')?.remove();

    // Clear current messages first
    document.getElementById('messagesList').innerHTML = '';

    // Load messages
    try {
      const data = await apiCall(`/api/messages/${channelId}`);
      const messages = data.messages || data; // support both formats
      const lastReadAt = data.lastReadAt;
      // Only render if still on this channel (user may have switched)
      if (activeChannelId === channelId) {
        UI.renderMessages(messages, currentUser.id, document.getElementById('messagesList'), lastReadAt);
        // Scroll to new message divider if exists, otherwise scroll to bottom
        const newDivider = document.getElementById('newMsgDivider');
        if (newDivider) {
          newDivider.scrollIntoView({ block: 'center' });
        } else {
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    // Mark as read + remove badge immediately
    socketClient.markRead(channelId);
    const activeLi = document.querySelector(`[data-channel-id="${channelId}"]`);
    if (activeLi) {
      const badge = activeLi.querySelector('.badge');
      if (badge) badge.remove();
    }

    // Close thread/members panels
    closeThread();
    document.getElementById('membersPanel').style.display = 'none';
  }

  function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
  }

  function updateUnreadBadge(channelId) {
    const li = document.querySelector(`[data-channel-id="${channelId}"]`);
    if (!li) return;
    let badge = li.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = '1';
      li.appendChild(badge);
    } else {
      badge.textContent = parseInt(badge.textContent) + 1;
    }
  }

  function showTyping(name) {
    const el = document.getElementById('typingIndicator');
    el.style.display = 'block';
    document.getElementById('typingText').textContent = `${name}님이 입력 중...`;

    if (typingTimers[name]) clearTimeout(typingTimers[name]);
    typingTimers[name] = setTimeout(() => {
      delete typingTimers[name];
      if (Object.keys(typingTimers).length === 0) {
        el.style.display = 'none';
      }
    }, 3000);
  }

  async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content && !pendingFile) return;
    if (!activeChannelId) return;

    const data = { channelId: activeChannelId, content };

    if (pendingFile) {
      data.fileUrl = pendingFile.url;
      data.fileName = pendingFile.originalName;
      data.fileType = pendingFile.mimeType;
    }

    socketClient.sendMessage(data, (res) => {
      if (res.error) {
        console.error(res.error);
        return;
      }
    });

    input.value = '';
    input.style.height = 'auto';
    clearPendingFile();
  }

  async function sendThreadMessage() {
    const input = document.getElementById('threadInput');
    const content = input.value.trim();
    if (!content || !activeThreadId || !activeChannelId) return;

    socketClient.sendMessage({
      channelId: activeChannelId,
      content,
      parentId: activeThreadId,
    }, (res) => {
      if (res.error) console.error(res.error);
    });

    input.value = '';
  }

  async function openThread(parentId) {
    activeThreadId = parentId;
    const panel = document.getElementById('threadPanel');
    panel.style.display = 'flex';

    const messages = await apiCall(`/api/messages/${activeChannelId}/thread/${parentId}`);
    const container = document.getElementById('threadMessages');
    container.innerHTML = '';
    messages.forEach(msg => {
      container.appendChild(UI.renderMessage(msg, currentUser.id));
    });
    container.scrollTop = container.scrollHeight;
  }

  function closeThread() {
    activeThreadId = null;
    document.getElementById('threadPanel').style.display = 'none';
  }

  function clearPendingFile() {
    pendingFile = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
  }

  let emojiTarget = null; // 'input' or messageId

  function onEmojiSelect(emoji) {
    if (emojiTarget === 'input') {
      const input = document.getElementById('messageInput');
      input.value += emoji;
      input.focus();
    } else if (emojiTarget) {
      socketClient.addReaction({ messageId: emojiTarget, emoji });
    }
    document.getElementById('emojiPicker').style.display = 'none';
    emojiTarget = null;
  }

  // === Event Listeners ===

  // Channel click
  document.getElementById('channelList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li?.dataset.channelId) selectChannel(li.dataset.channelId);
  });

  document.getElementById('dmList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li?.dataset.channelId) selectChannel(li.dataset.channelId);
  });

  // User click (start DM)
  document.getElementById('userList').addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li?.dataset.userId) return;
    const channel = await apiCall('/api/channels/dm', {
      method: 'POST',
      body: JSON.stringify({ userId: li.dataset.userId }),
    });
    await loadChannels(true);
    selectChannel(channel.id);
  });

  // Send message
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  document.getElementById('messageInput').addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  });

  // Typing indicator
  const sendTypingDebounced = debounce(() => {
    if (activeChannelId) socketClient.sendTyping(activeChannelId);
  }, 1000);
  document.getElementById('messageInput').addEventListener('input', sendTypingDebounced);

  // Thread send
  document.getElementById('threadSendBtn').addEventListener('click', sendThreadMessage);
  document.getElementById('threadInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendThreadMessage();
    }
  });

  // Thread close
  document.getElementById('threadClose').addEventListener('click', closeThread);

  // File upload
  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      pendingFile = data;
      document.getElementById('filePreviewName').textContent = data.originalName;
      document.getElementById('filePreview').style.display = 'flex';
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('filePreviewRemove').addEventListener('click', clearPendingFile);

  // Drag & Drop file upload
  const mainContent = document.querySelector('.main-content');
  const dropOverlay = document.getElementById('dropOverlay');
  let dragCounter = 0;

  mainContent.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (activeChannelId) dropOverlay.style.display = 'flex';
  });

  mainContent.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) dropOverlay.style.display = 'none';
  });

  mainContent.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  mainContent.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.style.display = 'none';
    if (!activeChannelId) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      pendingFile = data;
      document.getElementById('filePreviewName').textContent = data.originalName;
      document.getElementById('filePreview').style.display = 'flex';
    } catch (err) {
      alert(err.message);
    }
  });

  // Emoji picker
  document.getElementById('emojiBtn').addEventListener('click', () => {
    emojiTarget = 'input';
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  });

  // Close emoji picker on outside click
  document.addEventListener('click', (e) => {
    const picker = document.getElementById('emojiPicker');
    if (picker.style.display !== 'none' && !e.target.closest('.emoji-picker') && !e.target.closest('#emojiBtn')) {
      picker.style.display = 'none';
    }
  });

  // Message actions (delegation)
  document.getElementById('messagesList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      // Check for reaction click
      const reaction = e.target.closest('.reaction');
      if (reaction) {
        socketClient.addReaction({
          messageId: reaction.dataset.messageId,
          emoji: reaction.dataset.emoji,
        });
        return;
      }
      // Check for thread link
      const threadLink = e.target.closest('.thread-link');
      if (threadLink) {
        openThread(threadLink.dataset.parentId);
        return;
      }
      return;
    }

    const msgEl = btn.closest('.message');
    const messageId = msgEl.dataset.messageId;
    const action = btn.dataset.action;

    if (action === 'react') {
      emojiTarget = messageId;
      const picker = document.getElementById('emojiPicker');
      picker.style.display = 'block';
    } else if (action === 'thread') {
      openThread(messageId);
    } else if (action === 'edit') {
      const contentEl = msgEl.querySelector('.message-content');
      const oldContent = contentEl.textContent;
      const newContent = prompt('메시지 수정:', oldContent);
      if (newContent !== null && newContent !== oldContent) {
        socketClient.editMessage({ messageId, content: newContent });
      }
    } else if (action === 'delete') {
      if (confirm('메시지를 삭제하시겠습니까?')) {
        socketClient.deleteMessage({ messageId });
      }
    }
  });

  // Thread messages actions
  document.getElementById('threadMessages').addEventListener('click', (e) => {
    const reaction = e.target.closest('.reaction');
    if (reaction) {
      socketClient.addReaction({
        messageId: reaction.dataset.messageId,
        emoji: reaction.dataset.emoji,
      });
    }
  });

  // Add channel
  document.getElementById('addChannelBtn').addEventListener('click', () => {
    UI.showModal('채널 만들기', `
      <div class="form-group">
        <label>채널 이름</label>
        <input type="text" id="newChannelName" placeholder="예: project-alpha">
      </div>
      <div class="form-group">
        <label>설명 (선택)</label>
        <input type="text" id="newChannelDesc" placeholder="채널에 대한 간단한 설명">
      </div>
      <button class="btn" id="createChannelBtn">만들기</button>
    `);
    document.getElementById('createChannelBtn').addEventListener('click', async () => {
      const name = document.getElementById('newChannelName').value.trim();
      const description = document.getElementById('newChannelDesc').value.trim();
      if (!name) return;
      try {
        const channel = await apiCall('/api/channels', {
          method: 'POST',
          body: JSON.stringify({ name, description }),
        });
        UI.hideModal();
        await loadChannels(true);
        selectChannel(channel.id);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Add DM / Group chat
  document.getElementById('addDmBtn').addEventListener('click', () => {
    const checkboxes = allUsers
      .filter(u => u.id !== currentUser.id)
      .map(u => `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
        <input type="checkbox" value="${u.id}" class="dm-user-check"> ${escapeHtml(u.display_name)} (@${escapeHtml(u.username)})
      </label>`)
      .join('');
    UI.showModal('대화 시작', `
      <div class="form-group">
        <label>사용자 선택 (1명=DM, 2명+=그룹채팅)</label>
        <div style="max-height:200px;overflow-y:auto;padding:4px">${checkboxes}</div>
      </div>
      <div class="form-group" id="groupNameGroup" style="display:none">
        <label>그룹 이름 (선택)</label>
        <input type="text" id="groupChatName" placeholder="예: 프로젝트팀">
      </div>
      <button class="btn" id="startChatBtn">대화 시작</button>
    `);

    // Show group name field when 2+ selected
    document.querySelectorAll('.dm-user-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = document.querySelectorAll('.dm-user-check:checked');
        document.getElementById('groupNameGroup').style.display = checked.length >= 2 ? 'block' : 'none';
      });
    });

    document.getElementById('startChatBtn').addEventListener('click', async () => {
      const selected = Array.from(document.querySelectorAll('.dm-user-check:checked')).map(cb => cb.value);
      if (selected.length === 0) return;

      try {
        let channel;
        if (selected.length === 1) {
          // 1:1 DM
          channel = await apiCall('/api/channels/dm', {
            method: 'POST',
            body: JSON.stringify({ userId: selected[0] }),
          });
        } else {
          // Group chat
          const name = document.getElementById('groupChatName').value.trim();
          channel = await apiCall('/api/channels/group', {
            method: 'POST',
            body: JSON.stringify({ userIds: selected, name: name || undefined }),
          });
        }
        UI.hideModal();
        await loadChannels(true);
        selectChannel(channel.id);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Invite members to channel
  document.getElementById('inviteBtn').addEventListener('click', async () => {
    if (!activeChannelId) return;
    const channel = channels.find(c => c.id === activeChannelId);
    if (!channel) return;

    // Get current members
    const members = await apiCall(`/api/channels/${activeChannelId}/members`);
    const memberIds = new Set(members.map(m => m.id));

    const checkboxes = allUsers
      .filter(u => u.id !== currentUser.id && !memberIds.has(u.id))
      .map(u => `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer">
        <input type="checkbox" value="${u.id}" class="invite-check"> ${escapeHtml(u.display_name)} (@${escapeHtml(u.username)})
      </label>`)
      .join('');

    if (!checkboxes) {
      UI.showModal('멤버 초대', '<p style="color:var(--text-secondary)">초대할 수 있는 사용자가 없습니다 (모두 참가 중)</p>');
      return;
    }

    UI.showModal('멤버 초대', `
      <div class="form-group">
        <label>초대할 사용자 선택</label>
        <div style="max-height:200px;overflow-y:auto;padding:4px">${checkboxes}</div>
      </div>
      <button class="btn" id="confirmInviteBtn">초대</button>
    `);

    document.getElementById('confirmInviteBtn').addEventListener('click', async () => {
      const selected = Array.from(document.querySelectorAll('.invite-check:checked')).map(cb => cb.value);
      if (selected.length === 0) return;
      try {
        for (const userId of selected) {
          if (channel.is_dm === 0) {
            await apiCall(`/api/channels/${activeChannelId}/join`, {
              method: 'POST',
              body: JSON.stringify({ userId }),
            }).catch(() => {});
            // Direct DB add via invite for public channels
            await apiCall(`/api/channels/${activeChannelId}/invite`, {
              method: 'POST',
              body: JSON.stringify({ userId }),
            }).catch(() => {});
          } else {
            await apiCall(`/api/channels/${activeChannelId}/invite`, {
              method: 'POST',
              body: JSON.stringify({ userId }),
            });
          }
        }
        UI.hideModal();
        await loadChannels(true);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Search
  document.getElementById('searchToggle').addEventListener('click', () => {
    const bar = document.getElementById('searchBar');
    bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    if (bar.style.display === 'flex') document.getElementById('searchInput').focus();
  });

  document.getElementById('searchClose').addEventListener('click', () => {
    document.getElementById('searchBar').style.display = 'none';
    // Restore messages
    if (activeChannelId) selectChannel(activeChannelId);
  });

  const searchDebounced = debounce(async (query) => {
    if (query.length < 2) return;
    try {
      const results = await apiCall(`/api/messages/search/query?q=${encodeURIComponent(query)}`);
      UI.renderSearchResults(results, query, document.getElementById('messagesList'));
    } catch (err) {
      console.error(err);
    }
  }, 300);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchDebounced(e.target.value.trim());
  });

  // Search result click
  document.getElementById('messagesList').addEventListener('click', (e) => {
    const result = e.target.closest('.search-result');
    if (result?.dataset.channelId) {
      document.getElementById('searchBar').style.display = 'none';
      selectChannel(result.dataset.channelId);
    }
  });

  // Members panel
  document.getElementById('membersToggle').addEventListener('click', async () => {
    const panel = document.getElementById('membersPanel');
    if (panel.style.display === 'none' || panel.style.display === '') {
      if (!activeChannelId) return;
      const members = await apiCall(`/api/channels/${activeChannelId}/members`);
      UI.renderMembers(members);
      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
    }
  });

  document.getElementById('membersClose').addEventListener('click', () => {
    document.getElementById('membersPanel').style.display = 'none';
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', UI.hideModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) UI.hideModal();
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? null : 'light';
    if (next) {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('likeslack-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('likeslack-theme', 'dark');
    }
  });

  // Logout
  // Profile edit (click on current user)
  document.getElementById('currentUser').addEventListener('click', () => {
    const colors = ['#E74C3C','#3498DB','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E67E22','#34495E','#E91E63','#00BCD4','#FF5722','#607D8B'];
    const colorBtns = colors.map(c =>
      `<button class="color-btn" data-color="${c}" style="background:${c};width:36px;height:36px;border:2px solid transparent;border-radius:8px;cursor:pointer;margin:4px" title="${c}"></button>`
    ).join('');
    UI.showModal('프로필 수정', `
      <div class="form-group">
        <label>표시 이름</label>
        <input type="text" id="editDisplayName" value="${escapeHtml(currentUser.displayName)}">
      </div>
      <div class="form-group">
        <label>아바타 색상</label>
        <div style="display:flex;flex-wrap:wrap;gap:2px">${colorBtns}</div>
        <input type="hidden" id="editAvatarColor" value="${currentUser.avatarColor}">
      </div>
      <button class="btn" id="saveProfileBtn">저장</button>
    `);

    // Highlight current color
    document.querySelectorAll('.color-btn').forEach(btn => {
      if (btn.dataset.color === currentUser.avatarColor) btn.style.borderColor = '#fff';
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = '#fff';
        document.getElementById('editAvatarColor').value = btn.dataset.color;
      });
    });

    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
      const displayName = document.getElementById('editDisplayName').value.trim();
      const avatarColor = document.getElementById('editAvatarColor').value;
      try {
        const updated = await apiCall('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ displayName, avatarColor }),
        });
        currentUser.displayName = updated.displayName;
        currentUser.avatarColor = updated.avatarColor;
        UI.renderCurrentUser(currentUser);
        UI.hideModal();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await apiCall('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('likeslack-user');
    localStorage.removeItem('likeslack-token');
    window.location.href = '/login.html';
  });

  // Desktop notification permission
  // Show notification permission banner if not granted
  if ('Notification' in window && Notification.permission === 'default') {
    const banner = document.createElement('div');
    banner.id = 'notifBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#4A90D9;color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;z-index:999;font-size:14px;';
    banner.innerHTML = `
      <span>알림을 허용하면 새 메시지를 바로 받을 수 있습니다</span>
      <div style="display:flex;gap:8px">
        <button id="notifAllow" style="background:#fff;color:#4A90D9;border:none;padding:6px 16px;border-radius:6px;font-weight:700;cursor:pointer">허용</button>
        <button id="notifDismiss" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.5);padding:6px 12px;border-radius:6px;cursor:pointer">나중에</button>
      </div>`;
    document.body.prepend(banner);
    document.getElementById('notifAllow').addEventListener('click', async () => {
      await Notification.requestPermission();
      banner.remove();
    });
    document.getElementById('notifDismiss').addEventListener('click', () => {
      banner.remove();
    });
  }

  // Clear badge when app gains focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      unreadTotal = 0;
      if (navigator.clearAppBadge) navigator.clearAppBadge();
      // Reload current channel messages to show what arrived while in background
      if (activeChannelId) selectChannel(activeChannelId);
    }
  });

  window.addEventListener('focus', () => {
    unreadTotal = 0;
    if (navigator.clearAppBadge) navigator.clearAppBadge();
    if (activeChannelId) selectChannel(activeChannelId);
  });

  // Scroll to load more messages
  document.getElementById('messagesContainer').addEventListener('scroll', async (e) => {
    if (e.target.scrollTop === 0 && activeChannelId) {
      const firstMsg = document.querySelector('.message');
      if (!firstMsg) return;
      const firstMsgId = firstMsg.dataset.messageId;
      const firstMsgEl = document.querySelector(`[data-message-id="${firstMsgId}"]`);
      const firstTime = firstMsgEl?.querySelector('.message-time')?.textContent;
      // Could implement cursor-based pagination here
    }
  });
})();
