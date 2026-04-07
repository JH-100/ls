import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default' &&
      !localStorage.getItem('likeslack-notif-asked')
    ) {
      setVisible(true);
    }
  }, []);

  const handleAllow = async () => {
    localStorage.setItem('likeslack-notif-asked', 'true');
    setVisible(false);
    if (typeof Notification !== 'undefined') {
      await Notification.requestPermission();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('likeslack-notif-asked', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="notification-banner">
      <span>알림을 허용하면 새 메시지를 바로 받을 수 있습니다</span>
      <button className="btn btn-primary" onClick={handleAllow}>
        허용
      </button>
      <button className="btn btn-dismiss" onClick={handleDismiss}>
        나중에
      </button>
    </div>
  );
}
