import { useRef, useCallback, useEffect } from 'react';

// Notification sound using Web Audio API
function createNotificationSound() {
  let audioCtx = null;
  return () => {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}
  };
}

// Favicon badge — draws a number on the favicon dynamically
const originalFavicon = '/assets/icon-192.png';
function setFaviconBadge(count) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 64, 64);
    if (count > 0) {
      // Red circle
      const text = count > 99 ? '99+' : String(count);
      const badgeSize = text.length > 2 ? 36 : 28;
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.arc(64 - badgeSize / 2, badgeSize / 2, badgeSize / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      // White text
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${badgeSize * 0.65}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64 - badgeSize / 2, badgeSize / 2 + 1);
    }
    const link = document.querySelector("link[rel='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = canvas.toDataURL();
    document.head.appendChild(link);
  };
  img.src = count > 0 ? originalFavicon : originalFavicon;
  if (count === 0) {
    const link = document.querySelector("link[rel='icon']");
    if (link) link.href = originalFavicon;
  }
}

export function useNotification() {
  const playSound = useRef(createNotificationSound()).current;
  const originalTitle = useRef('LikeSlack');
  const flashInterval = useRef(null);
  const toastTimeout = useRef(null);
  const totalUnread = useRef(0);

  // Update badge (taskbar + favicon + title)
  const updateBadge = useCallback((count) => {
    totalUnread.current = count;

    // Taskbar badge (PWA)
    try { if (navigator.setAppBadge) navigator.setAppBadge(count); } catch {}

    // Favicon badge
    setFaviconBadge(count);

    // Title
    if (count > 0) {
      document.title = `(${count}) LikeSlack`;
    } else {
      document.title = originalTitle.current;
    }
  }, []);

  // Clear everything
  const clearBadge = useCallback(() => {
    totalUnread.current = 0;
    try { if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch {}
    setFaviconBadge(0);
    document.title = originalTitle.current;
    if (flashInterval.current) {
      clearInterval(flashInterval.current);
      flashInterval.current = null;
    }
  }, []);

  // In-app toast popup
  const showToast = useCallback((title, body, onClick) => {
    const existing = document.getElementById('ls-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ls-toast';
    toast.style.cssText = `
      position:fixed; top:16px; right:16px; z-index:9999;
      background:var(--bg-secondary,#222529); color:var(--text-primary,#d1d2d3);
      border:1px solid var(--border-color,#3f4147); border-radius:12px;
      padding:14px 18px; max-width:340px; min-width:240px;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      cursor:pointer; animation:lsSlideIn 0.3s ease-out;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    `;
    toast.innerHTML = `
      <div style="font-weight:800;font-size:14px;margin-bottom:4px">${title}</div>
      <div style="font-size:13px;color:var(--text-secondary,#8b8d91);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${body}</div>
    `;
    toast.onclick = () => { toast.remove(); if (onClick) onClick(); };

    if (!document.getElementById('ls-toast-style')) {
      const style = document.createElement('style');
      style.id = 'ls-toast-style';
      style.textContent = `
        @keyframes lsSlideIn { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes lsSlideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(120%);opacity:0} }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'lsSlideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }, []);

  // Main notify function
  const notify = useCallback((senderName, content, onClick) => {
    totalUnread.current++;
    const count = totalUnread.current;

    // 1. Sound
    playSound();

    // 2. Badge (taskbar + favicon + title)
    updateBadge(count);

    // 3. In-app toast
    const body = content || '새 파일이 전송되었습니다';
    showToast(senderName, body.length > 80 ? body.substring(0, 80) + '...' : body, onClick);

    // 4. Native notification (if available)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const n = new Notification(senderName, {
          body: body.length > 100 ? body.substring(0, 100) + '...' : body,
          icon: '/assets/icon-192.png',
          tag: 'ls-msg',
          silent: true,
        });
        n.onclick = () => { window.focus(); if (onClick) onClick(); n.close(); };
      } catch {}
    }
  }, [playSound, updateBadge, showToast]);

  // Auto-clear on focus
  useEffect(() => {
    const handle = () => clearBadge();
    window.addEventListener('focus', handle);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') clearBadge();
    });
    return () => window.removeEventListener('focus', handle);
  }, [clearBadge]);

  return { notify, clearBadge, updateBadge };
}
