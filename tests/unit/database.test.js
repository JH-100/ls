import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const TEST_DB_PATH = path.join(import.meta.dirname, '..', '..', 'data', 'test-unit.db');

let db;

beforeAll(() => {
  try { if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH); } catch {}
  db = new Database(TEST_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#4A90D9',
      status TEXT DEFAULT 'online',
      last_seen TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_dm INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE channel_members (
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      last_read_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (channel_id, user_id)
    );
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT DEFAULT NULL,
      edited INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE reactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(message_id, user_id, emoji)
    );
  `);
});

afterAll(() => {
  if (db) db.close();
  try { if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH); } catch {}
});

describe('Database - Users', () => {
  it('should insert and retrieve a user', () => {
    db.prepare('INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)').run(
      'u1', 'alice', 'hash123', 'Alice'
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('u1');
    expect(user).toBeDefined();
    expect(user.username).toBe('alice');
    expect(user.display_name).toBe('Alice');
    expect(user.status).toBe('online');
  });

  it('should enforce unique username', () => {
    expect(() => {
      db.prepare('INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)').run(
        'u2', 'alice', 'hash456', 'Alice2'
      );
    }).toThrow();
  });

  it('should update user status', () => {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('offline', 'u1');
    const user = db.prepare('SELECT status FROM users WHERE id = ?').get('u1');
    expect(user.status).toBe('offline');
  });
});

describe('Database - Channels', () => {
  it('should create a channel', () => {
    db.prepare('INSERT INTO channels (id, name, description, created_by) VALUES (?, ?, ?, ?)').run(
      'ch1', 'general', '기본 채널', 'u1'
    );
    const ch = db.prepare('SELECT * FROM channels WHERE id = ?').get('ch1');
    expect(ch.name).toBe('general');
    expect(ch.is_dm).toBe(0);
  });

  it('should add member to channel', () => {
    db.prepare('INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)').run('ch1', 'u1');
    const member = db.prepare('SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?').get('ch1', 'u1');
    expect(member).toBeDefined();
  });
});

describe('Database - Messages', () => {
  it('should create a message', () => {
    db.prepare('INSERT INTO messages (id, channel_id, user_id, content) VALUES (?, ?, ?, ?)').run(
      'm1', 'ch1', 'u1', 'Hello world'
    );
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get('m1');
    expect(msg.content).toBe('Hello world');
    expect(msg.edited).toBe(0);
  });

  it('should create a thread reply', () => {
    db.prepare('INSERT INTO messages (id, channel_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)').run(
      'm2', 'ch1', 'u1', 'Reply', 'm1'
    );
    const replies = db.prepare('SELECT * FROM messages WHERE parent_id = ?').all('m1');
    expect(replies).toHaveLength(1);
  });

  it('should edit a message', () => {
    db.prepare('UPDATE messages SET content = ?, edited = 1 WHERE id = ?').run('Edited', 'm1');
    const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get('m1');
    expect(msg.edited).toBe(1);
  });
});

describe('Database - Reactions', () => {
  it('should add a reaction', () => {
    db.prepare('INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)').run('r1', 'm1', 'u1', '👍');
    const reactions = db.prepare('SELECT * FROM reactions WHERE message_id = ?').all('m1');
    expect(reactions).toHaveLength(1);
  });

  it('should prevent duplicate reactions', () => {
    expect(() => {
      db.prepare('INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)').run('r2', 'm1', 'u1', '👍');
    }).toThrow();
  });

  it('should allow different emoji on same message', () => {
    db.prepare('INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)').run('r3', 'm1', 'u1', '❤️');
    const reactions = db.prepare('SELECT * FROM reactions WHERE message_id = ?').all('m1');
    expect(reactions).toHaveLength(2);
  });
});
