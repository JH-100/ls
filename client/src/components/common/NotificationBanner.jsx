import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (localStorage.getItem('likeslack-notif-asked')) return;

    const perm = Notification.permission;
    setPermission(perm);

    // Show banner if not yet granted
    if (perm !== 'granted') {
      setVisible(true);
    }
  }, []);

  const handleAllow = async () => {
    if (typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        localStorage.setItem('likeslack-notif-asked', 'true');
        setVisible(false);
        // Test notification
        new Notification('LikeSlack', { body: '알림이 활성화되었습니다!', icon: '/assets/icon-192.png' });
        return;
      }
      // If denied by browser (HTTP restriction), show guide
      if (result === 'denied') {
        setPermission('denied');
        return; // keep banner visible with guide text
      }
    }
    localStorage.setItem('likeslack-notif-asked', 'true');
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('likeslack-notif-asked', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="notification-banner">
      {permission === 'denied' ? (
        <>
          <span>알림이 차단되어 있습니다. 주소창 왼쪽 🔒 → 사이트 설정 → 알림 → 허용으로 변경해주세요</span>
          <button className="btn btn-dismiss" onClick={handleDismiss}>닫기</button>
        </>
      ) : (
        <>
          <span>알림을 허용하면 새 메시지를 바로 받을 수 있습니다</span>
          <button className="btn btn-primary" onClick={handleAllow}>허용</button>
          <button className="btn btn-dismiss" onClick={handleDismiss}>나중에</button>
        </>
      )}
    </div>
  );
}
