const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const session = require('express-session');
const path = require('path');
const os = require('os');
const { initializeDatabase } = require('./src/database');
const { setupSocket } = require('./src/socket');

const app = express();

// HTTPS setup (self-signed cert for local network PWA support)
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');
const hasSSL = fs.existsSync(certPath) && fs.existsSync(keyPath);

let server;
if (hasSSL) {
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  server = https.createServer(sslOptions, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Session middleware (cryptographically secure secret)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // allow both http and https on local network
  },
});

app.use(sessionMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Share session with Socket.IO
io.engine.use(sessionMiddleware);

// App version — changes on every server restart, triggers client reload
const APP_VERSION = Date.now().toString();

// Static files (no-cache for HTML/JS/CSS so updates apply immediately)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Version API
app.get('/api/version', (req, res) => res.json({ version: APP_VERSION }));

// API routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/channels', require('./src/routes/channels'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/files', require('./src/routes/files'));

// Initialize database
initializeDatabase();

// Setup Socket.IO
setupSocket(io);

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3333;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  const proto = hasSSL ? 'https' : 'http';
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║           LikeSlack Messenger            ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Local:   ${proto}://localhost:${PORT}        ║`);
  console.log(`  ║  Network: ${proto}://${ip}:${PORT}    ║`);
  if (hasSSL) {
  console.log('  ║  (HTTPS - PWA 설치 가능)                  ║');
  }
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
