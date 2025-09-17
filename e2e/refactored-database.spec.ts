import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Database } from '../database/Database.js';

let serverProcess: ChildProcessWithoutNullStreams | undefined;
let dbPath: string;
let testPort: number;
let baseUrl: string;

async function waitForServer(processRef: ChildProcessWithoutNullStreams, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for refactored server to start'));
    }, 10000);

    const handleOutput = (data: Buffer) => {
      const text = data.toString();
      if (text.includes(`Server listening on port ${port}`)) {
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

test.beforeAll(async (_, workerInfo) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `jazz-refactored-${workerInfo.workerIndex}-`));
  dbPath = path.join(tempRoot, 'refactored-e2e.db');
  testPort = 3200 + workerInfo.workerIndex;
  baseUrl = `http://127.0.0.1:${testPort}`;

  await fs.rm(dbPath, { force: true });

  const seededDb = new Database(dbPath);
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
      PORT: String(testPort),
      DB_PATH: dbPath,
      JAZZ_DISABLE_AUTO_LISTEN: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForServer(serverProcess, testPort);
});

test.afterAll(async () => {
  if (serverProcess) {
    await new Promise<void>((resolve) => {
      serverProcess!.once('close', () => resolve());
      serverProcess!.kill();
    });
  }
  if (dbPath) {
    await fs.rm(dbPath, { force: true });
    await fs.rm(path.dirname(dbPath), { recursive: true, force: true });
  }
});

test('refactored architecture persists results with a seeded database', async ({ page, request }) => {
  await page.goto(`${baseUrl}?arch=refactored`);

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

  const performanceResponse = await request.get(`${baseUrl}/performance-summary`);
  const performanceJson = await performanceResponse.json();

  expect(performanceJson.stats.total_sessions).toBeGreaterThanOrEqual(2);
  expect(Array.isArray(performanceJson.summary)).toBe(true);
});
