import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';

process.env.JAZZ_DISABLE_AUTO_LISTEN = 'true';

let legacyApp;
let analyzeChordProblems;
let refactoredApp;
let initializeDatabase;
let closeDatabase;
let db;

const fixturesDir = path.join(process.cwd(), 'tests', 'tmp');
const legacyDataFile = path.join(fixturesDir, 'session-data.csv');
const legacyRecentFile = path.join(fixturesDir, 'session-data-last-10.csv');
const sqliteFile = path.join(fixturesDir, 'integration.sqlite');

beforeAll(async () => {
  await fs.mkdir(fixturesDir, { recursive: true });

  process.env.SESSION_DATA_FILE = legacyDataFile;
  process.env.SESSION_DATA_LAST_10_FILE = legacyRecentFile;
  process.env.DB_PATH = sqliteFile;

  ({ app: legacyApp, analyzeChordProblems } = await import('../../server.js'));
  ({ app: refactoredApp, initializeDatabase, closeDatabase, db } = await import('../../server-refactored.js'));

  await initializeDatabase();
});

afterAll(async () => {
  await closeDatabase();
  await fs.rm(fixturesDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await closeDatabase();
  await fs.rm(legacyDataFile, { force: true });
  await fs.rm(legacyRecentFile, { force: true });
  await fs.rm(sqliteFile, { force: true });
  await initializeDatabase();
});

describe('Legacy CSV-backed server', () => {
  test('POST /append-session-data writes to CSV files', async () => {
    const now = new Date().toISOString();
    const payload = {
      data: [
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '3.2', date: now },
        { stringSet: '2', root: '4', key: 'F#', quality: 'min7b5', time: '4.5', date: now }
      ]
    };

    const response = await request(legacyApp)
      .post('/append-session-data')
      .send(payload)
      .expect(200);

    expect(response.body.message).toContain('Data appended successfully');

    const csvContents = await fs.readFile(legacyDataFile, 'utf-8');
    expect(csvContents).toContain('1,2,C,maj7,3.2');
    expect(csvContents).toContain('2,4,F#,min7b5,4.5');

    const lastTenContents = await fs.readFile(legacyRecentFile, 'utf-8');
    const rows = lastTenContents.trim().split('\n');
    expect(rows).toHaveLength(3); // header + 2 rows
  });

  test('GET /analyze-session-data aggregates the recent CSV data', async () => {
    const now = new Date().toISOString();
    const payload = {
      data: [
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '3.0', date: now },
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '9.0', date: now },
        { stringSet: '2', root: '4', key: 'A', quality: 'dom7', time: '8.5', date: now }
      ]
    };

    await request(legacyApp).post('/append-session-data').send(payload).expect(200);

    const response = await request(legacyApp).get('/analyze-session-data').expect(200);

    expect(response.body.results.length).toBeGreaterThan(0);
    const topResult = response.body.results[0];
    expect(topResult).toHaveProperty('chordInfo');
    expect(topResult).toHaveProperty('avgTime');
  });

  test('analyzeChordProblems helper reads CSV file correctly', async () => {
    const csvData = 'SS,Root,Key,Quality,Time,Date\n1,2,C,maj7,5.0,2024-01-01T00:00:00.000Z\n';
    await fs.writeFile(legacyRecentFile, csvData, 'utf-8');

    const results = await analyzeChordProblems(legacyRecentFile, 1);
    expect(results[0].chordInfo).toContain('SS1, R/2, C maj7');
    expect(results[0].avgTime).toBe(5);
  });
});

describe('Refactored SQLite-backed server', () => {
  test('POST /append-session-data persists a session', async () => {
    const payload = {
      data: [
        { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '3.4', date: new Date().toISOString(), wasMarkedWrong: false },
        { stringSet: '2', root: '3', key: 'F', quality: 'min7', time: '4.8', date: new Date().toISOString(), wasMarkedWrong: true }
      ]
    };

    const response = await request(refactoredApp)
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

    await request(refactoredApp).post('/append-session-data').send(payload).expect(200);

    const response = await request(refactoredApp).get('/analyze-session-data').expect(200);
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
    expect(response.body.results[0]).toHaveProperty('chordInfo');
  });
});
