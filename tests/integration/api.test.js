import request from 'supertest';
import express from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const TEST_DB = path.join(import.meta.dirname, '..', '..', 'data', 'test-integration.db');

let app;
let agent;

beforeAll(() => {
  // Use separate test DB to avoid polluting production
  try { if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB); } catch {}
  process.env.DB_PATH = TEST_DB;

  // Clear module cache so database.js picks up new DB_PATH
  delete require.cache[require.resolve('../../src/database')];
  delete require.cache[require.resolve('../../src/routes/auth')];
  delete require.cache[require.resolve('../../src/routes/channels')];
  delete require.cache[require.resolve('../../src/routes/messages')];

  const { initializeDatabase } = require('../../src/database');
  initializeDatabase();

  app = express();
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(express.json());
  app.use('/api/auth', require('../../src/routes/auth'));
  app.use('/api/channels', require('../../src/routes/channels'));
  app.use('/api/messages', require('../../src/routes/messages'));

  agent = request.agent(app);
});

afterAll(() => {
  const { closeDatabase } = require('../../src/database');
  closeDatabase();
  try { if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB); } catch {}
  delete process.env.DB_PATH;
});

describe('Auth API', () => {
  it('POST /api/auth/register - should register a user', async () => {
    const res = await agent.post('/api/auth/register').send({
      username: 'apitest' + Date.now(),
      password: 'test1234',
      displayName: 'API Tester',
    });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('API Tester');
  });

  it('POST /api/auth/register - should reject short password', async () => {
    const res = await agent.post('/api/auth/register').send({
      username: 'shortpw',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me - should return current user', async () => {
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'nobody',
      password: 'wrong',
    });
    expect(res.status).toBe(401);
  });
});

describe('Channels API', () => {
  it('GET /api/channels - should list channels', async () => {
    const res = await agent.get('/api/channels');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/channels - should create a channel', async () => {
    const res = await agent.post('/api/channels').send({
      name: 'test-' + Date.now(),
      description: 'test channel',
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/channels - should reject empty name', async () => {
    const res = await agent.post('/api/channels').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('GET /api/channels/browse/all - should list all public channels', async () => {
    const res = await agent.get('/api/channels/browse/all');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Messages API', () => {
  let channelId;

  beforeAll(async () => {
    const res = await agent.get('/api/channels');
    channelId = res.body.find((c) => c.name === 'general')?.id;
  });

  it('GET /api/messages/:channelId - should return messages', async () => {
    const res = await agent.get(`/api/messages/${channelId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/messages/search/query - should reject short query', async () => {
    const res = await agent.get('/api/messages/search/query?q=a');
    expect(res.status).toBe(400);
  });
});
