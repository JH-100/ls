const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const AVATAR_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

router.post('/register', async (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '사용자명은 2-20자여야 합니다' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '이미 사용 중인 사용자명입니다' });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const name = displayName || username;

  db.prepare('INSERT INTO users (id, username, password_hash, display_name, avatar_color) VALUES (?, ?, ?, ?, ?)').run(
    id, username, passwordHash, name, avatarColor
  );

  // Auto-join #general channel
  const general = db.prepare('SELECT id FROM channels WHERE name = ?').get('general');
  if (general) {
    db.prepare('INSERT OR IGNORE INTO channel_members (channel_id, user_id) VALUES (?, ?)').run(general.id, id);
  }

  req.session.userId = id;
  req.session.username = username;

  res.json({ id, username, displayName: name, avatarColor });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
  }

  db.prepare('UPDATE users SET status = ?, last_seen = datetime(?) WHERE id = ?').run('online', 'now', user.id);

  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarColor: user.avatar_color,
  });
});

router.post('/logout', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET status = ?, last_seen = datetime(?) WHERE id = ?').run('offline', 'now', req.session.userId);

  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, display_name, avatar_color, avatar_url, status FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarColor: user.avatar_color,
    avatarUrl: user.avatar_url,
    status: user.status,
  });
});

// Update profile (display name, avatar color, avatar url)
router.put('/profile', requireAuth, (req, res) => {
  const { displayName, avatarColor, avatarUrl } = req.body;
  const db = getDb();

  if (displayName && displayName.trim().length > 0) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), req.session.userId);
  }
  if (avatarColor && /^#[0-9a-fA-F]{6}$/.test(avatarColor)) {
    db.prepare('UPDATE users SET avatar_color = ? WHERE id = ?').run(avatarColor, req.session.userId);
  }
  if (avatarUrl !== undefined) {
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl || null, req.session.userId);
  }

  const user = db.prepare('SELECT id, username, display_name, avatar_color, avatar_url, status FROM users WHERE id = ?').get(req.session.userId);
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarColor: user.avatar_color,
    avatarUrl: user.avatar_url,
    status: user.status,
  });
});

// Upload avatar image (resize to 128x128)
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const avatarUpload = multer({ limits: { fileSize: 5 * 1024 * 1024 }, storage: multer.memoryStorage() });

router.post('/avatar', requireAuth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '이미지를 선택해주세요' });
    if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: '이미지 파일만 가능합니다' });

    try {
      const filename = `avatar-${req.session.userId}.png`;
      const outPath = path.join(__dirname, '..', '..', 'uploads', filename);

      await sharp(req.file.buffer)
        .resize(128, 128, { fit: 'cover' })
        .png()
        .toFile(outPath);

      const avatarUrl = `/uploads/${filename}`;
      const db = getDb();
      db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.session.userId);

      res.json({ avatarUrl });
    } catch (e) {
      console.error('Avatar upload error:', e);
      res.status(500).json({ error: '이미지 처리에 실패했습니다' });
    }
  });
});

module.exports = router;
