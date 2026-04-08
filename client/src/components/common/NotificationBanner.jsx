import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return;

    // If default — request immediately (like vanilla JS did)
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(result => {
        if (result === 'granted') {
          new Notification('LikeSlack', { body: '알림이 활성화되었습니다!', icon: '/assets/icon-192.png' });
        } else if (result === 'denied') {
          setIsDenied(true);
          setVisible(true);
        }
      });
      return;
    }

    // Already denied
    if (Notification.permission === 'denied') {
      if (!localStorage.getItem('likeslack-notif-dismissed')) {
        setIsDenied(true);
        setVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('likeslack-notif-dismissed', 'true');
    setVisible(false);
  };

  const handleRetry = async () => {
    if (typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        new Notification('LikeSlack', { body: '알림이 활성화되었습니다!', icon: '/assets/icon-192.png' });
        setVisible(false);
        return;
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="notification-banner">
      <span>알림이 차단되어 있습니다. 주소 왼쪽 🔒 클릭 → 알림 → 허용, 또는 </span>
      <button className="btn btn-primary" onClick={handleRetry}>다시 허용 요청</button>
      <button className="btn btn-dismiss" onClick={handleDismiss}>닫기</button>
    </div>
  );
}
