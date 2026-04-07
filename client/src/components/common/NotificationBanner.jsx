import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (localStorage.getItem('likeslack-notif-asked')) return;
    if (Notification.permission === 'granted') return;

    setIsDenied(Notification.permission === 'denied');
    setVisible(true);
  }, []);

  const handleAllow = async () => {
    if (typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        new Notification('LikeSlack', { body: '알림이 활성화되었습니다!', icon: '/assets/icon-192.png' });
        localStorage.setItem('likeslack-notif-asked', 'true');
        setVisible(false);
        return;
      }
      if (result === 'denied') {
        setIsDenied(true);
        return;
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
      {isDenied ? (
        <>
          <span>알림이 차단되어 있습니다. 주소창에 <b>edge://settings/content/notifications</b> 입력 → 허용에 이 사이트 추가 후 새로고침</span>
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
