import { test, expect } from '@playwright/test';

test('Jazz Chords App', async ({ page }) => {
  // Navigate to the home page
  await page.goto('http://localhost:3000');

  // Check that the title is correct
  await expect(page).toHaveTitle('Jazz Chords Practice');

  // Check that the problem container is visible
  const problemContainer = page.locator('.problem-container');
  await expect(problemContainer).toBeVisible();


  // Check that the start/stop button is visible
  const startStopButton = page.getByRole('button', { name: /Start|Stop/ });
  await expect(startStopButton).toBeVisible();

  const baseTimeout = 300;
  const timeoutIncrement = 400;

  for (let i = 0; i < 4; i++) {
    await startStopButton.click();
    const currentTimeout = baseTimeout + (i * timeoutIncrement);
    await page.waitForTimeout(currentTimeout);
    await startStopButton.click();
    const fretboard = page.locator('#fretboard-container');
    await expect(fretboard).toBeVisible();
    console.log(`Iteration ${i + 1}: Waited for ${currentTimeout}ms`);
  }

  // Wait for the "See Results" button to be visible
  const seeResultsButton = page.getByRole('button', { name: /See Results/ });
  await expect(seeResultsButton).toBeVisible();

  // Click the "See Results" button
  await seeResultsButton.click();
  
  // Wait for the <h3> element with text "Chord Shapes That Need More Practice:" to be visible
  const chordShapesHeader = page.getByRole('heading', { name: 'Drill These Chord Shapes:' });
  await expect(chordShapesHeader).toBeVisible();
});
