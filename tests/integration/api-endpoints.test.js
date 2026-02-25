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

describe('Input validation', () => {
  test('POST /append-session-data rejects empty data array', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [] })
      .expect(400);

    expect(response.body.message).toContain('non-empty');
  });

  test('POST /append-session-data rejects missing data field', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ foo: 'bar' })
      .expect(400);

    expect(response.body.message).toContain('non-empty');
  });

  test('POST /append-session-data rejects invalid stringSet', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [{ stringSet: '9', root: '2', key: 'C', quality: 'maj7', time: '3.0', date: new Date().toISOString() }] })
      .expect(400);

    expect(response.body.errors[0]).toContain('stringSet');
  });

  test('POST /append-session-data rejects invalid key', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [{ stringSet: '1', root: '2', key: 'Z#', quality: 'maj7', time: '3.0', date: new Date().toISOString() }] })
      .expect(400);

    expect(response.body.errors[0]).toContain('key');
  });

  test('POST /append-session-data rejects invalid quality', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [{ stringSet: '1', root: '2', key: 'C', quality: 'sus4', time: '3.0', date: new Date().toISOString() }] })
      .expect(400);

    expect(response.body.errors[0]).toContain('quality');
  });

  test('POST /append-session-data rejects negative time', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [{ stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '-5', date: new Date().toISOString() }] })
      .expect(400);

    expect(response.body.errors[0]).toContain('time');
  });

  test('POST /append-session-data rejects excessive time values', async () => {
    const response = await request(app)
      .post('/append-session-data')
      .send({ data: [{ stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '999', date: new Date().toISOString() }] })
      .expect(400);

    expect(response.body.errors[0]).toContain('time');
  });

  test('POST /wipe-database rejects without valid confirmation', async () => {
    const response = await request(app)
      .post('/wipe-database')
      .send({ confirmation: 'WRONG TEXT' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test('GET /health returns server status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
  });
});
