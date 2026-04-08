const { app, BrowserWindow, Notification, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); return; }

// Server URL — change this to your server IP
const SERVER_URL = process.argv[2] || 'http://localhost:3333';

let mainWindow = null;
let tray = null;
let unreadCount = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'LikeSlack',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  // Set badge count when receiving from renderer
  mainWindow.on('page-title-updated', (e, title) => {
    // Parse "(3) LikeSlack" format
    const match = title.match(/^\((\d+)\)/);
    if (match) {
      const count = parseInt(match[1]);
      if (count !== unreadCount) {
        unreadCount = count;
        updateBadge(count);
        // Show notification for new messages
        if (count > 0 && !mainWindow.isFocused()) {
          showNotification(count);
        }
      }
    } else if (unreadCount > 0) {
      unreadCount = 0;
      updateBadge(0);
    }
  });

  mainWindow.on('focus', () => {
    unreadCount = 0;
    updateBadge(0);
  });

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    e.preventDefault();
    mainWindow.hide();
  });
}

function updateBadge(count) {
  if (process.platform === 'win32' && mainWindow) {
    if (count > 0) {
      // Draw badge on overlay icon
      mainWindow.setOverlayIcon(createBadgeIcon(count), `${count} unread`);
    } else {
      mainWindow.setOverlayIcon(null, '');
    }
  }
  // Update tray tooltip
  if (tray) {
    tray.setToolTip(count > 0 ? `LikeSlack (${count}개 안 읽음)` : 'LikeSlack');
  }
}

function createBadgeIcon(count) {
  // Create a simple red circle with number using nativeImage
  const size = 16;
  const canvas = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#E74C3C"/>
      <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="middle"
            fill="white" font-size="${count > 9 ? 9 : 11}" font-weight="bold" font-family="Arial">
        ${count > 99 ? '99+' : count}
      </text>
    </svg>`;
  return nativeImage.createFromBuffer(
    Buffer.from(canvas),
    { width: size, height: size }
  );
}

function showNotification(count) {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: 'LikeSlack',
      body: `${count}개의 새 메시지가 있습니다`,
      icon: path.join(__dirname, 'icon.png'),
      silent: false,
    });
    notif.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    notif.show();
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('LikeSlack');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '열기', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: '종료', click: () => { mainWindow.destroy(); app.quit(); } },
  ]));
  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('second-instance', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // Keep running in tray
});
