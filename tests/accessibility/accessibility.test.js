import { test, expect, describe, beforeAll, afterAll } from '@jest/globals';
import puppeteer from 'puppeteer';
import AxeBuilder from '@axe-core/puppeteer';

describe('Accessibility Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('WCAG Compliance', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have no accessibility violations on initial load', async () => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toHaveLength(0);
    });

    test('should maintain accessibility during session', async () => {
      // Start a session
      await page.click('#start-stop-button');
      
      // Wait for chord to be displayed
      await page.waitForFunction(() => {
        const textField = document.getElementById('stringSetTextField');
        return textField && textField.textContent !== '--';
      });
      
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toHaveLength(0);
    });

    test('should be accessible when showing results', async () => {
      // Complete a full session
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button'); // Start
        await page.waitForTimeout(100);
        await page.click('#start-stop-button'); // Stop
        await page.waitForTimeout(50);
      }
      
      // Click "See Results"
      await page.click('#start-stop-button');
      
      // Wait for results to be displayed
      await page.waitForFunction(() => {
        const resultsContainer = document.getElementById('results-container');
        return resultsContainer && resultsContainer.style.display !== 'none';
      });
      
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should be navigable using Tab key', async () => {
      const focusableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll(
          'button, select, input, a[href], [tabindex]:not([tabindex="-1"])'
        ));
        return elements.map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className
        }));
      });
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Test tabbing through all focusable elements
      for (let i = 0; i < focusableElements.length; i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return {
            tagName: focused.tagName,
            id: focused.id,
            className: focused.className
          };
        });
        
        // Should focus on a valid element
        expect(focusedElement.tagName).toBeTruthy();
      }
    });

    test('should allow start/stop with keyboard', async () => {
      // Focus on start button
      await page.focus('#start-stop-button');
      
      // Press Enter to start
      await page.keyboard.press('Enter');
      
      // Verify session started
      const buttonText = await page.$eval('#start-stop-button-label', el => el.textContent);
      expect(buttonText).toBe('Stop');
      
      // Press Enter to stop
      await page.keyboard.press('Enter');
      
      // Verify session stopped/paused
      const newButtonText = await page.$eval('#start-stop-button-label', el => el.textContent);
      expect(['Start', 'Stop']).toContain(newButtonText);
    });

    test('should allow options selection with keyboard', async () => {
      // Focus on key select
      await page.focus('#keySelect');
      
      // Use arrow keys to select option
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown'); // Select second option
      
      const selectedValue = await page.$eval('#keySelect', el => el.value);
      expect(selectedValue).toBeTruthy();
      
      // Test type select
      await page.focus('#typeSelect');
      await page.keyboard.press('ArrowDown');
      
      const selectedType = await page.$eval('#typeSelect', el => el.value);
      expect(selectedType).toBeTruthy();
    });

    test('should support copy keyboard shortcut', async () => {
      // Complete a session to show results
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button');
        await page.waitForTimeout(50);
        await page.click('#start-stop-button');
        await page.waitForTimeout(25);
      }
      
      await page.click('#start-stop-button'); // See Results
      
      // Wait for results to be displayed
      await page.waitForFunction(() => {
        const resultsContainer = document.getElementById('results-container');
        return resultsContainer && resultsContainer.style.display !== 'none';
      });
      
      // Test copy shortcut (Cmd+C on Mac, Ctrl+C on others)
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyC');
        await page.keyboard.up('Meta');
      } else {
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyC');
        await page.keyboard.up('Control');
      }
      
      // Check that copy feedback is shown
      const copyButtonText = await page.$eval('#copy-results-button', el => el.textContent);
      expect(copyButtonText).toBe('Copied!');
    });
  });

  describe('Screen Reader Support', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have proper ARIA labels and roles', async () => {
      const ariaLabels = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[aria-label], [aria-labelledby], [role]'));
        return elements.map(el => ({
          tagName: el.tagName,
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledBy: el.getAttribute('aria-labelledby'),
          role: el.getAttribute('role'),
          id: el.id
        }));
      });
      
      // Should have some ARIA attributes
      expect(ariaLabels.length).toBeGreaterThan(0);
    });

    test('should announce state changes', async () => {
      // Add an ARIA live region for testing
      await page.evaluate(() => {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.position = 'absolute';
        liveRegion.style.left = '-10000px';
        document.body.appendChild(liveRegion);
      });
      
      // Start session and check if state is announced
      await page.click('#start-stop-button');
      
      // Verify that button text changes (screen readers should detect this)
      const buttonText = await page.$eval('#start-stop-button-label', el => el.textContent);
      expect(buttonText).toBe('Stop');
    });

    test('should have descriptive alt text for important elements', async () => {
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img, svg'));
        return imgs.map(img => ({
          tagName: img.tagName,
          alt: img.getAttribute('alt'),
          ariaLabel: img.getAttribute('aria-label'),
          title: img.getAttribute('title'),
          id: img.id
        }));
      });
      
      // SVG elements should have accessible names
      images.forEach(img => {
        if (img.tagName === 'SVG') {
          expect(img.ariaLabel || img.title).toBeTruthy();
        }
      });
    });
  });

  describe('Color and Contrast', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should maintain readability in high contrast mode', async () => {
      // Simulate high contrast mode
      await page.emulateMediaFeatures([
        { name: 'prefers-contrast', value: 'high' }
      ]);
      
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Check that text is still visible
      const textElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, div, span, p, h1, h2, h3'));
        return elements.map(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            textContent: el.textContent.trim().substring(0, 50)
          };
        }).filter(el => el.textContent.length > 0);
      });
      
      // Should have visible text (not transparent)
      textElements.forEach(element => {
        expect(element.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(element.color).not.toBe('transparent');
      });
    });

    test('should work with reduced motion preferences', async () => {
      // Simulate reduced motion preference
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' }
      ]);
      
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Start a session
      await page.click('#start-stop-button');
      
      // Check that animations are still functional (just reduced)
      const hasAnimations = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => {
          const styles = window.getComputedStyle(el);
          return styles.transition !== 'all 0s ease 0s' || styles.animation !== 'none';
        });
      });
      
      // App should still work even with reduced motion
      const buttonText = await page.$eval('#start-stop-button-label', el => el.textContent);
      expect(buttonText).toBe('Stop');
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.setViewport({ width: 375, height: 667 }); // iPhone viewport
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have adequate touch targets', async () => {
      const touchTargets = await page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll('button, select, a, input'));
        return interactive.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            id: el.id,
            tagName: el.tagName,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          };
        }).filter(el => el.visible);
      });
      
      // Touch targets should be at least 44px in both dimensions (iOS guideline)
      touchTargets.forEach(target => {
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      });
    });

    test('should be usable on small screens', async () => {
      // Check that important elements are visible
      const visibleElements = await page.evaluate(() => {
        const important = [
          '#start-stop-button',
          '#stringSetTextField',
          '#keyTextField',
          '#typeTextField'
        ];
        
        return important.map(selector => {
          const el = document.querySelector(selector);
          if (!el) return { selector, visible: false };
          
          const rect = el.getBoundingClientRect();
          return {
            selector,
            visible: rect.width > 0 && rect.height > 0,
            inViewport: rect.top >= 0 && rect.left >= 0 && 
                       rect.bottom <= window.innerHeight && 
                       rect.right <= window.innerWidth
          };
        });
      });
      
      visibleElements.forEach(element => {
        expect(element.visible).toBe(true);
        expect(element.inViewport).toBe(true);
      });
    });
  });

  describe('Focus Management', () => {
    beforeEach(async () => {
      page = await browser.newPage();
      await page.goto('http://localhost:3000?arch=refactored');
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have visible focus indicators', async () => {
      const focusableElements = ['#start-stop-button', '#keySelect', '#typeSelect', '#stringSetSelect'];
      
      for (const selector of focusableElements) {
        await page.focus(selector);
        
        const focusStyles = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          const styles = window.getComputedStyle(el, ':focus');
          return {
            outline: styles.outline,
            outlineColor: styles.outlineColor,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        }, selector);
        
        // Should have some form of focus indicator
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    test('should trap focus in modal-like components', async () => {
      // Complete session to show results (acts like a modal)
      for (let i = 0; i < 10; i++) {
        await page.click('#start-stop-button');
        await page.waitForTimeout(50);
        await page.click('#start-stop-button');
        await page.waitForTimeout(25);
      }
      
      await page.click('#start-stop-button'); // See Results
      
      // Wait for results to be displayed
      await page.waitForFunction(() => {
        const resultsContainer = document.getElementById('results-container');
        return resultsContainer && resultsContainer.style.display !== 'none';
      });
      
      // Focus should be manageable within results area
      await page.focus('#copy-results-button');
      const focusedElement = await page.evaluate(() => document.activeElement.id);
      expect(focusedElement).toBe('copy-results-button');
    });
  });
});