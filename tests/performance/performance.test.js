import { test, expect, describe, beforeAll, afterAll } from '@jest/globals';
import puppeteer from 'puppeteer';

describe('Performance Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Page Load Performance', () => {
    test('should load main page within acceptable time', async () => {
      page = await browser.newPage();
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      await page.close();
    });

    test('should load refactored architecture within acceptable time', async () => {
      page = await browser.newPage();
      
      const startTime = Date.now();
      await page.goto('http://localhost:3000?arch=refactored', { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
      await page.close();
    });
  });

  describe('SVG Rendering Performance', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should render chord SVG quickly', async () => {
      // Start a session to trigger chord generation
      await page.click('#start-stop-button');
      
      // Measure time to render SVG
      const startTime = Date.now();
      await page.waitForFunction(() => {
        const fretboard = document.getElementById('fretboard');
        return fretboard && fretboard.children.length > 0;
      }, { timeout: 5000 });
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(500); // Should render within 500ms
    });

    test('should handle rapid chord changes without performance degradation', async () => {
      const renderTimes = [];
      
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button'); // Start
        
        const startTime = Date.now();
        await page.waitForFunction(() => {
          const textField = document.getElementById('stringSetTextField');
          return textField && textField.textContent !== '--';
        }, { timeout: 2000 });
        const renderTime = Date.now() - startTime;
        
        renderTimes.push(renderTime);
        
        // Quick stop to advance to next chord
        await page.waitForTimeout(100);
        await page.click('#start-stop-button'); // Stop
        
        if (i < 9) { // Don't wait after last iteration
          await page.waitForTimeout(100);
        }
      }
      
      // Check that render times remain consistent (no significant degradation)
      const avgRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes);
      
      expect(avgRenderTime).toBeLessThan(200);
      expect(maxRenderTime).toBeLessThan(500);
      
      // Check that later render times aren't significantly slower than earlier ones
      const firstHalf = renderTimes.slice(0, 5);
      const secondHalf = renderTimes.slice(5);
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 2); // No more than 2x slower
    });
  });

  describe('Memory Usage', () => {
    test('should not have significant memory leaks during session', async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
      
      // Get initial memory usage
      const initialMetrics = await page.metrics();
      const initialJSHeapSize = initialMetrics.JSHeapUsedSize;
      
      // Run multiple sessions
      for (let session = 0; session < 5; session++) {
        // Complete a full session
        for (let iteration = 0; iteration < 10; iteration++) {
          await page.click('#start-stop-button'); // Start
          await page.waitForTimeout(100);
          await page.click('#start-stop-button'); // Stop
          await page.waitForTimeout(50);
        }
        
        // Click "See Results"
        await page.click('#start-stop-button');
        await page.waitForTimeout(500);
        
        // Start new session (reset)
        await page.reload({ waitUntil: 'networkidle0' });
      }
      
      // Get final memory usage
      const finalMetrics = await page.metrics();
      const finalJSHeapSize = finalMetrics.JSHeapUsedSize;
      
      // Memory should not grow excessively (allow for some reasonable growth)
      const memoryGrowth = finalJSHeapSize - initialJSHeapSize;
      const growthPercentage = (memoryGrowth / initialJSHeapSize) * 100;
      
      expect(growthPercentage).toBeLessThan(50); // Less than 50% memory growth
      
      await page.close();
    });
  });

  describe('Large Dataset Performance', () => {
    test('should handle large session data efficiently', async () => {
      page = await browser.newPage();
      
      // Mock a large dataset response
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().includes('/analyze-session-data')) {
          request.respond({
            contentType: 'application/json',
            body: JSON.stringify({
              slowestChords: Array.from({ length: 100 }, (_, i) => ({
                stringSet: (i % 2) + 1,
                root: (i % 4) + 1,
                key: ['C', 'D', 'E', 'F'][i % 4],
                type: ['maj7', 'min7', 'dom7'][i % 3],
                avgTime: 2000 + (i * 10)
              })),
              totalSessions: 500,
              averageTime: 2800,
              improvementSuggestions: Array.from({ length: 20 }, (_, i) => 
                `Practice suggestion ${i + 1}`
              )
            })
          });
        } else {
          request.continue();
        }
      });
      
      await page.goto('http://localhost:3000?arch=refactored');
      
      // Complete a session to trigger results
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button');
        await page.waitForTimeout(50);
        await page.click('#start-stop-button');
        await page.waitForTimeout(25);
      }
      
      // Measure time to process and display large dataset
      const startTime = Date.now();
      await page.click('#start-stop-button'); // See Results
      
      await page.waitForFunction(() => {
        const resultsContainer = document.getElementById('results-container');
        return resultsContainer && resultsContainer.style.display !== 'none';
      }, { timeout: 5000 });
      
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
      
      await page.close();
    });
  });

  describe('CSS and Animation Performance', () => {
    test('should maintain smooth animations under load', async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
      
      // Enable performance monitoring
      await page.coverage.startCSSCoverage();
      
      // Simulate rapid interactions
      for (let i = 0; i < 20; i++) {
        await page.click('#start-stop-button');
        await page.waitForTimeout(50);
        await page.click('#start-stop-button');
        await page.waitForTimeout(25);
      }
      
      // Check for layout thrashing or excessive reflows
      const performanceMetrics = await page.evaluate(() => {
        return performance.getEntriesByType('measure').filter(entry => 
          entry.name.includes('Layout') || entry.name.includes('Paint')
        );
      });
      
      // Should not have excessive layout/paint operations
      expect(performanceMetrics.length).toBeLessThan(100);
      
      const cssCoverage = await page.coverage.stopCSSCoverage();
      
      // Check CSS efficiency (most CSS should be used)
      const totalBytes = cssCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
      const usedBytes = cssCoverage.reduce((sum, entry) => 
        sum + entry.ranges.reduce((rangeSum, range) => 
          rangeSum + (range.end - range.start), 0), 0
      );
      
      const usagePercentage = (usedBytes / totalBytes) * 100;
      expect(usagePercentage).toBeGreaterThan(60); // At least 60% CSS utilization
      
      await page.close();
    });
  });

  describe('Network Performance', () => {
    test('should minimize network requests during normal operation', async () => {
      page = await browser.newPage();
      
      const networkRequests = [];
      page.on('request', (request) => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      });
      
      await page.goto('http://localhost:3000?arch=refactored', { waitUntil: 'networkidle0' });
      
      const initialRequestCount = networkRequests.length;
      
      // Perform a complete session
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button');
        await page.waitForTimeout(100);
        await page.click('#start-stop-button');
        await page.waitForTimeout(50);
      }
      
      // Should not make additional network requests during chord generation
      const finalRequestCount = networkRequests.length;
      expect(finalRequestCount).toBe(initialRequestCount);
      
      await page.close();
    });
  });
});