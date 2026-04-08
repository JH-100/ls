const { app, BrowserWindow, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Server URL — reads from config.json next to exe, or argument, or default
function getServerUrl() {
  // 1. config.json next to exe
  try {
    const configPath = path.join(path.dirname(process.execPath), 'config.json');
    const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
    if (config.serverUrl) return config.serverUrl;
  } catch {}
  // 2. config.json in dev folder
  try {
    const config = JSON.parse(require('fs').readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    if (config.serverUrl) return config.serverUrl;
  } catch {}
  // 3. Command line argument
  const arg = process.argv.find(a => a.startsWith('http'));
  if (arg) return arg;
  // 4. Default
  return 'http://localhost:3333';
}
const SERVER_URL = getServerUrl();

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let mainWindow = null;
let tray = null;
let unreadCount = 0;

function getIconPath() {
  // Portable: icon next to exe. Dev: in desktop folder.
  const candidates = [
    path.join(path.dirname(process.execPath), 'icon.png'),
    path.join(__dirname, 'icon.png'),
  ];
  for (const p of candidates) {
    try { require('fs').accessSync(p); return p; } catch {}
  }
  return path.join(__dirname, 'icon.png');
}

function createBadgeOverlay(count) {
  // 16x16 red circle with white number
  const size = 20;
  const text = count > 99 ? '99' : String(count);
  const fontSize = text.length > 1 ? 11 : 13;

  // Use a data URL approach to create the overlay
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#E74C3C"/>
    <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="middle"
          fill="white" font-size="${fontSize}" font-weight="bold" font-family="Arial,sans-serif">${text}</text>
  </svg>`;

  return nativeImage.createFromBuffer(Buffer.from(svg), { width: size, height: size, scaleFactor: 1.0 });
}

function updateBadge(count) {
  if (!mainWindow) return;
  unreadCount = count;

  if (process.platform === 'win32') {
    if (count > 0) {
      try {
        mainWindow.setOverlayIcon(createBadgeOverlay(count), `${count} unread`);
      } catch (e) {
        // Fallback: flash taskbar
        mainWindow.flashFrame(true);
      }
    } else {
      mainWindow.setOverlayIcon(null, '');
      mainWindow.flashFrame(false);
    }
  }

  if (tray) {
    tray.setToolTip(count > 0 ? `LikeSlack (${count}개 안 읽음)` : 'LikeSlack');
  }
}

function showNativeNotification(count) {
  if (!Notification.isSupported()) return;

  const notif = new Notification({
    title: 'LikeSlack',
    body: `${count}개의 새 메시지가 있습니다`,
    icon: getIconPath(),
  });
  notif.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  notif.show();
}

function createWindow() {
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: 'LikeSlack',
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Watch title changes for badge — React sets "(N) LikeSlack" on unread
  let prevCount = 0;
  mainWindow.on('page-title-updated', (e, title) => {
    const match = title.match(/^\((\d+)\)/);
    const count = match ? parseInt(match[1]) : 0;

    if (count !== prevCount) {
      updateBadge(count);

      // Notify only when count increases and window not focused
      if (count > prevCount && !mainWindow.isFocused()) {
        showNativeNotification(count);
        mainWindow.flashFrame(true);
      }
      prevCount = count;
    }
  });

  mainWindow.on('focus', () => {
    updateBadge(0);
    prevCount = 0;
    mainWindow.flashFrame(false);
  });

  // Minimize to tray on close
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = getIconPath();
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('LikeSlack');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'LikeSlack 열기', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: '종료', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  console.log(`LikeSlack Desktop connecting to: ${SERVER_URL}`);
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  // Don't quit — stay in tray
});
