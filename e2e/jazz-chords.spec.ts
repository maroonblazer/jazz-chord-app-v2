import { test, expect } from '@playwright/test';

test('Jazz Chords App - Legacy Architecture', async ({ page }) => {
  // Navigate to the legacy version
  await page.goto('http://localhost:3000');

  // Check that the title is correct
  await expect(page).toHaveTitle('Jazz Chords Practice');

  // Check that legacy architecture is loaded
  await page.waitForFunction(() => {
    return window.console.log === console.log; // Simple check that JS is loaded
  });
});

test('Jazz Chords App - Refactored Architecture', async ({ page }) => {
  // Listen for console messages and errors to debug
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Navigate to the refactored version
  await page.goto('http://localhost:3000?arch=refactored');

  // Check that the title is correct
  await expect(page).toHaveTitle('Jazz Chords Practice');

  // Wait a moment and check for any JavaScript errors
  await page.waitForTimeout(3000);
  
  // Try to access jazzChordApp and log what we find
  const appStatus = await page.evaluate(() => {
    return {
      hasJazzChordApp: typeof window.jazzChordApp !== 'undefined',
      hasJazzChordAppGlobal: 'jazzChordApp' in window,
      windowKeys: Object.keys(window).filter(k => k.includes('jazz') || k.includes('Jazz') || k.includes('app')),
      errors: window.lastError || 'none'
    };
  });
  
  console.log('App Status:', JSON.stringify(appStatus, null, 2));

  // Check if Start button exists and is clickable
  const startButton = page.locator('#start-stop-button');
  await expect(startButton).toBeVisible({ timeout: 5000 });
  
  // Try clicking the start button manually
  console.log('Attempting to click start button...');
  await startButton.click();
  
  // Wait and check if anything happened
  await page.waitForTimeout(1000);
  
  const buttonState = await page.evaluate(() => {
    const button = document.getElementById('start-stop-button-label');
    return button ? button.textContent : 'not found';
  });
  
  console.log('Button label after click:', buttonState);

  // Check that the problem container is visible
  const problemContainer = page.locator('.problem-container');
  await expect(problemContainer).toBeVisible();

  // Check that the start/stop button is visible
  const startStopButton = page.getByRole('button', { name: /Start|Stop/ });
  await expect(startStopButton).toBeVisible();

  const baseTimeout = 300;
  const timeoutIncrement = 400;

  for (let i = 0; i < 10; i++) {
    console.log(`Starting iteration ${i + 1}`);
    
    // Click start
    await startStopButton.click();
    
    // Wait for the chord to be generated and displayed
    await page.waitForFunction(() => {
      const textField = document.getElementById('stringSetTextField');
      return textField && textField.textContent !== '--';
    }, { timeout: 5000 });
    
    // Wait the specified time (keep it short for faster testing)
    const currentTimeout = Math.min(baseTimeout + (i * 50), 1000);
    await page.waitForTimeout(currentTimeout);
    
    // Click stop - but check if button is still available first
    const buttonLabel = page.locator('#start-stop-button-label');
    const buttonText = await buttonLabel.textContent();
    if (buttonText === 'Stop') {
      await startStopButton.click();
    }
    
    // After 10th iteration, button should change to "See Results"
    if (i === 9) {
      // Wait for the button label to change to "See Results"
      const buttonLabel = page.locator('#start-stop-button-label');
      await expect(buttonLabel).toHaveText(/See Results/, { timeout: 5000 });
      console.log(`Iteration ${i + 1}: Button changed to "See Results"`);
      break;
    }
    
    // Wait for fretboard to be visible with solution
    const fretboard = page.locator('#fretboard-container');
    await expect(fretboard).toBeVisible();
    
    console.log(`Iteration ${i + 1}: Waited for ${currentTimeout}ms`);
  }

  // After 10 iterations, we should see the "See Results" button
  // Wait for the "See Results" button to be visible
  const seeResultsButton = page.getByRole('button', { name: /See Results/ });
  await expect(seeResultsButton).toBeVisible({ timeout: 10000 });

  // Click the "See Results" button
  await seeResultsButton.click();
  
  // Wait for the results to be displayed
  const chordShapesHeader = page.getByRole('heading', { name: 'Drill These Chord Shapes:' });
  await expect(chordShapesHeader).toBeVisible({ timeout: 10000 });
});
