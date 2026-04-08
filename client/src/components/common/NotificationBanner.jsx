import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;

    // Auto-request on load (like vanilla JS did)
    Notification.requestPermission().then(result => {
      if (result === 'granted') {
        new Notification('LikeSlack', { body: '알림이 활성화되었습니다!', icon: '/assets/icon-192.png' });
      }
      // Don't show banner regardless — sound/badge/toast work without permission
    });
  }, []);

  if (!visible) return null;
  return null;
}
