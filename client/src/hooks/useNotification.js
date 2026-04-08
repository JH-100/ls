import { useRef, useCallback, useEffect } from 'react';

export function useNotification() {
  const totalUnread = useRef(0);

  const updateBadge = useCallback((count) => {
    totalUnread.current = count;
    try { navigator.setAppBadge?.(count); } catch {}
    document.title = count > 0 ? `(${count}) LikeSlack` : 'LikeSlack';
  }, []);

  const clearBadge = useCallback(() => {
    totalUnread.current = 0;
    try { navigator.clearAppBadge?.(); } catch {}
    document.title = 'LikeSlack';
  }, []);

  const notify = useCallback(() => {
    totalUnread.current++;
    updateBadge(totalUnread.current);
  }, [updateBadge]);

  // Clear on focus
  useEffect(() => {
    const handle = () => clearBadge();
    window.addEventListener('focus', handle);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') clearBadge();
    });
    return () => window.removeEventListener('focus', handle);
  }, [clearBadge]);

  return { notify, clearBadge };
}
