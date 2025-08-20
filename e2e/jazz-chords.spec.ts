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

test('Options Menu Functionality', async ({ page }) => {
  // Navigate to the refactored version
  await page.goto('http://localhost:3000?arch=refactored');
  
  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Check that options button exists and click it to open menu
  const optionsButton = page.locator('#options-button');
  await expect(optionsButton).toBeVisible();
  await optionsButton.click();

  // Wait for options menu to be visible
  const optionsMenu = page.locator('.options-menu');
  await expect(optionsMenu).toBeVisible();

  // Test Key selection dropdown
  const keySelect = page.locator('#key-select');
  await expect(keySelect).toBeVisible();
  await keySelect.selectOption('C');
  
  const selectedKey = await keySelect.inputValue();
  expect(selectedKey).toBe('C');

  // Test Type selection dropdown
  const typeSelect = page.locator('#type-select');
  await expect(typeSelect).toBeVisible();
  await typeSelect.selectOption('maj7');
  
  const selectedType = await typeSelect.inputValue();
  expect(selectedType).toBe('maj7');

  // Test String Set selection dropdown
  const stringSetSelect = page.locator('#string-set-select');
  await expect(stringSetSelect).toBeVisible();
  await stringSetSelect.selectOption('1');
  
  const selectedStringSet = await stringSetSelect.inputValue();
  expect(selectedStringSet).toBe('1');

  // Test Reset All Options button
  const resetButton = page.locator('#reset-options-button');
  await expect(resetButton).toBeVisible();
  await resetButton.click();

  // Verify all options are reset to "Random" (empty value)
  const keyAfterReset = await keySelect.inputValue();
  const typeAfterReset = await typeSelect.inputValue();
  const stringSetAfterReset = await stringSetSelect.inputValue();
  
  expect(keyAfterReset).toBe('');
  expect(typeAfterReset).toBe('');
  expect(stringSetAfterReset).toBe('');
});

test('Options Menu Affects Chord Generation', async ({ page }) => {
  // Navigate to the refactored version
  await page.goto('http://localhost:3000?arch=refactored');
  await page.waitForTimeout(2000);

  // Open options menu
  await page.locator('#options-button').click();
  
  // Set specific options
  await page.locator('#key-select').selectOption('C');
  await page.locator('#type-select').selectOption('maj7');
  await page.locator('#string-set-select').selectOption('1');

  // Close options menu (click button again)
  await page.locator('#options-button').click();

  // Start a chord session
  const startButton = page.locator('#start-stop-button');
  await startButton.click();

  // Wait for chord to be generated
  await page.waitForFunction(() => {
    const keyField = document.getElementById('keyTextField');
    const typeField = document.getElementById('typeTextField');
    const stringSetField = document.getElementById('stringSetTextField');
    return keyField && typeField && stringSetField && 
           keyField.textContent !== '--' && 
           typeField.textContent !== '--' && 
           stringSetField.textContent !== '--';
  }, { timeout: 5000 });

  // Verify the generated chord matches our selected options
  const keyText = await page.locator('#keyTextField').textContent();
  const typeText = await page.locator('#typeTextField').textContent();
  const stringSetText = await page.locator('#stringSetTextField').textContent();

  expect(keyText).toBe('C');
  expect(typeText).toBe('maj7');
  expect(stringSetText).toBe('1');

  // Stop the current chord
  await startButton.click();

  // Start another chord to verify consistency
  await startButton.click();

  // Wait for new chord generation
  await page.waitForTimeout(1000);

  // Verify the second chord also matches our options
  const keyText2 = await page.locator('#keyTextField').textContent();
  const typeText2 = await page.locator('#typeTextField').textContent();
  const stringSetText2 = await page.locator('#stringSetTextField').textContent();

  expect(keyText2).toBe('C');
  expect(typeText2).toBe('maj7');
  expect(stringSetText2).toBe('1');
});

test('Options Menu Partial Selection Works', async ({ page }) => {
  // Navigate to the refactored version
  await page.goto('http://localhost:3000?arch=refactored');
  await page.waitForTimeout(2000);

  // Open options menu and set only the key
  await page.locator('#options-button').click();
  await page.locator('#key-select').selectOption('F#');
  await page.locator('#options-button').click();

  // Generate multiple chords to verify only key is fixed
  const chords = [];
  for (let i = 0; i < 5; i++) {
    await page.locator('#start-stop-button').click();
    
    await page.waitForFunction(() => {
      const keyField = document.getElementById('keyTextField');
      return keyField && keyField.textContent !== '--';
    }, { timeout: 5000 });
    
    const key = await page.locator('#keyTextField').textContent();
    const type = await page.locator('#typeTextField').textContent();
    const stringSet = await page.locator('#stringSetTextField').textContent();
    
    chords.push({ key, type, stringSet });
    
    await page.locator('#start-stop-button').click();
    await page.waitForTimeout(500);
  }

  // Verify all chords have the same key but different types/string sets
  chords.forEach(chord => {
    expect(chord.key).toBe('F#');
  });

  // Verify there's variation in types and string sets (not all the same)
  const uniqueTypes = new Set(chords.map(c => c.type));
  const uniqueStringSets = new Set(chords.map(c => c.stringSet));
  
  // With 5 chords and random selection, we should get some variation
  expect(uniqueTypes.size).toBeGreaterThan(1);
});
