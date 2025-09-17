import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Database } from '../database/Database.js';

const TEST_PORT = 3200;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const DB_PATH = path.join(process.cwd(), 'e2e', 'tmp', 'refactored-e2e.db');

let serverProcess: ChildProcessWithoutNullStreams | undefined;

async function waitForServer(processRef: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for refactored server to start'));
    }, 10000);

    const handleOutput = (data: Buffer) => {
      const text = data.toString();
      if (text.includes(`Server listening on port ${TEST_PORT}`)) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      processRef.stdout.off('data', handleOutput);
      processRef.stderr.off('data', handleOutput);
    };

    processRef.stdout.on('data', handleOutput);
    processRef.stderr.on('data', handleOutput);
  });
}

test.beforeAll(async () => {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.rm(DB_PATH, { force: true });

  const seededDb = new Database(DB_PATH);
  await seededDb.init();
  await seededDb.wipeAllData();

  const sessionId = await seededDb.createSession({ source: 'playwright-seed' });
  const now = new Date().toISOString();
  await seededDb.addSessionResults(sessionId, [
    { stringSet: '1', root: '2', key: 'C', quality: 'maj7', time: '4.2', date: now, wasMarkedWrong: false },
    { stringSet: '2', root: '4', key: 'Bb', quality: 'dom7', time: '7.5', date: now, wasMarkedWrong: true }
  ]);
  await seededDb.completeSession(sessionId, 2);
  await seededDb.close();

  serverProcess = spawn('node', ['server-refactored.js'], {
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      DB_PATH,
      JAZZ_DISABLE_AUTO_LISTEN: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForServer(serverProcess);
});

test.afterAll(async () => {
  if (serverProcess) {
    await new Promise<void>((resolve) => {
      serverProcess!.once('close', () => resolve());
      serverProcess!.kill();
    });
  }
  await fs.rm(DB_PATH, { force: true });
});

test('refactored architecture persists results with a seeded database', async ({ page, request }) => {
  await page.goto(`${BASE_URL}?arch=refactored`);

  // Reduce the number of required iterations for a faster test run
  await page.evaluate(() => {
    const app = window['jazzChordApp'];
    if (app) {
      app.stateManager.updateState('session.maxIterations', 2);
    }
  });

  const startStopButton = page.locator('#start-stop-button');

  for (let i = 0; i < 2; i++) {
    await startStopButton.click();
    await page.waitForTimeout(100);
    await startStopButton.click();
  }

  // Final click transitions LAST -> END and fetches analysis
  await page.waitForTimeout(100);
  await startStopButton.click();

  const resultsHeader = page.getByRole('heading', { name: 'Drill These Chord Shapes:' });
  await expect(resultsHeader).toBeVisible({ timeout: 10000 });

  const performanceResponse = await request.get(`${BASE_URL}/performance-summary`);
  const performanceJson = await performanceResponse.json();

  expect(performanceJson.stats.total_sessions).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(performanceJson.summary)).toBe(true);
});
