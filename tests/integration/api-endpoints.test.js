import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';

process.env.JAZZ_DISABLE_AUTO_LISTEN = 'true';

let app;
let initializeDatabase;
let closeDatabase;
let db;

const fixturesDir = path.join(process.cwd(), 'tests', 'tmp');
const sqliteFile = path.join(fixturesDir, 'integration.sqlite');

beforeAll(async () => {
  await fs.mkdir(fixturesDir, { recursive: true });

  process.env.DB_PATH = sqliteFile;

  ({ app, initializeDatabase, closeDatabase, db } = await import('../../server.js'));

  await initializeDatabase();
});

afterAll(async () => {
  await closeDatabase();
  await fs.rm(fixturesDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await closeDatabase();
  await fs.rm(sqliteFile, { force: true });
  await initializeDatabase();
});

describe('SQLite-backed server', () => {
  test('POST /append-session-data persists a session', async () => {
    const payload = {
      data: [
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '3.4', date: new Date().toISOString(), wasMarkedWrong: false },
        { stringSet: '2', root: '3', key: 'F', quality: 'min7', time: '4.8', date: new Date().toISOString(), wasMarkedWrong: true }
      ]
    };

    const response = await request(app)
      .post('/append-session-data')
      .send(payload)
      .expect(200);

    expect(response.body.resultsCount).toBe(2);
    expect(response.body.sessionId).toBeGreaterThan(0);
  });

  test('GET /analyze-session-data returns aggregated chord data', async () => {
    const payload = {
      data: [
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '3.4', date: new Date().toISOString(), wasMarkedWrong: false },
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '7.1', date: new Date().toISOString(), wasMarkedWrong: false },
        { stringSet: '2', root: '3', key: 'F', quality: 'min7', time: '5.0', date: new Date().toISOString(), wasMarkedWrong: false }
      ]
    };

    await request(app).post('/append-session-data').send(payload).expect(200);

    const response = await request(app).get('/analyze-session-data').expect(200);
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
    expect(response.body.results[0]).toHaveProperty('chordInfo');
  });
});
