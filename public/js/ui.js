// UI rendering functions

const UI = {
  renderChannelList(channels, activeChannelId) {
    // Active channel should never show unread badge
    channels.forEach(ch => {
      if (ch.id === activeChannelId) ch.unread_count = 0;
    });
    const channelList = document.getElementById('channelList');
    const dmList = document.getElementById('dmList');
    channelList.innerHTML = '';
    dmList.innerHTML = '';

    channels.forEach(ch => {
      const li = document.createElement('li');
      li.dataset.channelId = ch.id;
      if (ch.id === activeChannelId) li.classList.add('active');

      if (ch.is_dm === 1) {
        // 1:1 DM
        const user = ch.dmUser;
        const dot = document.createElement('span');
        dot.className = `status-dot ${user?.status || 'offline'}`;
        li.appendChild(dot);
        li.appendChild(document.createTextNode(user?.display_name || 'Unknown'));
        if (ch.unread_count > 0) {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = ch.unread_count;
          li.appendChild(badge);
        }
        dmList.appendChild(li);
      } else if (ch.is_dm === 2) {
        // Group chat
        const icon = document.createElement('span');
        icon.className = 'channel-icon';
        icon.innerHTML = Icons.users;
        li.appendChild(icon);
        li.appendChild(document.createTextNode(ch.name));
        if (ch.unread_count > 0) {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = ch.unread_count;
          li.appendChild(badge);
        }
        dmList.appendChild(li);
      } else {
        // Public channel
        const icon = document.createElement('span');
        icon.className = 'channel-icon';
        icon.innerHTML = Icons.hash;
        li.appendChild(icon);
        li.appendChild(document.createTextNode(ch.name));
        if (ch.unread_count > 0) {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = ch.unread_count;
          li.appendChild(badge);
        }
        channelList.appendChild(li);
      }
    });
  },

  renderUserList(users, currentUserId) {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';

    users.forEach(user => {
      if (user.id === currentUserId) return;
      const li = document.createElement('li');
      li.dataset.userId = user.id;
      const dot = document.createElement('span');
      dot.className = `status-dot ${user.status}`;
      li.appendChild(dot);
      li.appendChild(document.createTextNode(user.display_name));
      userList.appendChild(li);
    });
  },

  renderMessage(msg, currentUserId) {
    const div = document.createElement('div');
    div.className = 'message';
    div.dataset.messageId = msg.id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.background = msg.avatar_color || '#4A90D9';
    avatar.textContent = getInitial(msg.display_name);

    const body = document.createElement('div');
    body.className = 'message-body';

    // Header
    const header = document.createElement('div');
    header.className = 'message-header';
    const author = document.createElement('span');
    author.className = 'message-author';
    author.textContent = msg.display_name;
    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(msg.created_at);
    header.appendChild(author);
    header.appendChild(time);
    if (msg.edited) {
      const edited = document.createElement('span');
      edited.className = 'message-edited';
      edited.textContent = '(수정됨)';
      header.appendChild(edited);
    }

    // Read receipt
    if (msg.user_id === currentUserId && msg.totalMembers > 0) {
      const readEl = document.createElement('span');
      readEl.className = 'message-read';
      readEl.dataset.total = msg.totalMembers;
      if (msg.readCount >= msg.totalMembers) {
        readEl.textContent = '\u2713 모두 읽음';
        readEl.classList.add('read-all');
      } else if (msg.readCount > 0) {
        readEl.textContent = `\u2713 ${msg.readCount}명 읽음`;
      } else {
        readEl.textContent = '\u2713 안 읽음';
        readEl.classList.add('read-none');
      }
      header.appendChild(readEl);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = formatMessageContent(msg.content || '');

    body.appendChild(header);
    body.appendChild(content);

    // File attachment
    if (msg.file_url) {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'message-file';
      if (msg.file_type && msg.file_type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = msg.file_url;
        img.alt = msg.file_name || 'image';
        img.loading = 'lazy';
        fileDiv.appendChild(img);
      } else {
        const link = document.createElement('a');
        link.className = 'file-info';
        link.href = msg.file_url;
        link.target = '_blank';
        link.innerHTML = Icons.file + ' ' + escapeHtml(msg.file_name || '파일 다운로드');
        fileDiv.appendChild(link);
      }
      body.appendChild(fileDiv);
    }

    // Reactions
    if (msg.reactions && msg.reactions.length > 0) {
      const reactionsDiv = document.createElement('div');
      reactionsDiv.className = 'message-reactions';

      const grouped = {};
      msg.reactions.forEach(r => {
        if (!grouped[r.emoji]) grouped[r.emoji] = [];
        grouped[r.emoji].push(r);
      });

      Object.entries(grouped).forEach(([emoji, users]) => {
        const btn = document.createElement('button');
        btn.className = 'reaction';
        if (users.some(u => u.user_id === currentUserId)) btn.classList.add('mine');
        btn.innerHTML = `<span class="emoji">${emoji}</span><span class="count">${users.length}</span>`;
        btn.title = users.map(u => u.display_name).join(', ');
        btn.dataset.emoji = emoji;
        btn.dataset.messageId = msg.id;
        reactionsDiv.appendChild(btn);
      });
      body.appendChild(reactionsDiv);
    }

    // Thread link
    if (msg.reply_count > 0) {
      const threadLink = document.createElement('div');
      threadLink.className = 'thread-link';
      threadLink.dataset.parentId = msg.id;
      threadLink.textContent = `${msg.reply_count}개의 답글`;
      body.appendChild(threadLink);
    }

    // Hover actions
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const emojiAction = document.createElement('button');
    emojiAction.title = '이모지 반응';
    emojiAction.innerHTML = Icons.smile;
    emojiAction.dataset.action = 'react';
    actions.appendChild(emojiAction);

    const threadAction = document.createElement('button');
    threadAction.title = '스레드';
    threadAction.innerHTML = Icons.messageSquare;
    threadAction.dataset.action = 'thread';
    actions.appendChild(threadAction);

    if (msg.user_id === currentUserId) {
      const editAction = document.createElement('button');
      editAction.title = '수정';
      editAction.innerHTML = Icons.edit;
      editAction.dataset.action = 'edit';
      actions.appendChild(editAction);

      const deleteAction = document.createElement('button');
      deleteAction.title = '삭제';
      deleteAction.innerHTML = Icons.trash;
      deleteAction.dataset.action = 'delete';
      actions.appendChild(deleteAction);
    }

    div.appendChild(avatar);
    div.appendChild(body);
    div.appendChild(actions);

    return div;
  },

  renderMessages(messages, currentUserId, container, lastReadAt) {
    container.innerHTML = '';
    let lastDate = '';
    let newMsgDividerInserted = false;

    // Find if there are unread messages
    const hasUnread = lastReadAt && messages.some(m => m.created_at > lastReadAt && m.user_id !== currentUserId);

    messages.forEach(msg => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== lastDate) {
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.textContent = msgDate;
        container.appendChild(divider);
        lastDate = msgDate;
      }

      // Insert "new messages" divider before the first unread message
      if (hasUnread && !newMsgDividerInserted && msg.created_at > lastReadAt && msg.user_id !== currentUserId) {
        const newDivider = document.createElement('div');
        newDivider.className = 'new-msg-divider';
        newDivider.id = 'newMsgDivider';
        newDivider.textContent = '여기서부터 새 메시지';
        container.appendChild(newDivider);
        newMsgDividerInserted = true;
      }

      container.appendChild(this.renderMessage(msg, currentUserId));
    });
  },

  renderCurrentUser(user) {
    const el = document.getElementById('currentUser');
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.style.background = user.avatarColor;
    avatar.textContent = getInitial(user.displayName);
    el.innerHTML = '';
    el.appendChild(avatar);
    el.appendChild(document.createTextNode(user.displayName));
  },

  renderMembers(members) {
    const list = document.getElementById('membersList');
    list.innerHTML = '';
    members.forEach(m => {
      const li = document.createElement('li');
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.style.background = m.avatar_color;
      avatar.textContent = getInitial(m.display_name);
      const dot = document.createElement('span');
      dot.className = `status-dot ${m.status}`;
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;';
      li.appendChild(avatar);
      li.appendChild(dot);
      li.appendChild(document.createTextNode(m.display_name));
      list.appendChild(li);
    });
  },

  renderSearchResults(messages, query, container) {
    container.innerHTML = '';
    if (messages.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>검색 결과가 없습니다</p></div>';
      return;
    }
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'search-result';
      div.dataset.channelId = msg.channel_id;
      const tag = document.createElement('div');
      tag.className = 'channel-tag';
      tag.textContent = `#${msg.channel_name}`;
      const header = document.createElement('div');
      header.className = 'message-header';
      header.innerHTML = `<span class="message-author">${escapeHtml(msg.display_name)}</span>
        <span class="message-time">${formatTime(msg.created_at)}</span>`;
      const content = document.createElement('div');
      content.className = 'message-content';
      const highlighted = msg.content.replace(
        new RegExp(`(${escapeHtml(query)})`, 'gi'),
        '<span class="highlight">$1</span>'
      );
      content.innerHTML = highlighted;
      div.appendChild(tag);
      div.appendChild(header);
      div.appendChild(content);
      container.appendChild(div);
    });
  },

  showModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').style.display = 'flex';
  },

  hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
  },

  updateUserStatus(userId, status) {
    // Update sidebar user list
    document.querySelectorAll(`[data-user-id="${userId}"] .status-dot`).forEach(dot => {
      dot.className = `status-dot ${status}`;
    });
    // Update DM list
    document.querySelectorAll('#dmList li').forEach(li => {
      const dot = li.querySelector('.status-dot');
      if (dot && li.dataset.dmUserId === userId) {
        dot.className = `status-dot ${status}`;
      }
    });
  },
};
