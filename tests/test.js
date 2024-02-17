// import { maxIterations } from '../public/app.js';
import puppeteer from 'puppeteer';
import { access, constants, unlink } from 'fs';
import { join } from 'path';

// Delete the session-data.csv file if it exists
const filePath = join(process.cwd(), './session-data.csv');
access(filePath, constants.F_OK, err => {
  if (!err) {
    unlink(filePath, err => {
      if (err) {
        console.log(err);
      }
    });
  }
});

async function runTest() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--window-size=1280,1280', '--window-position=1700,0'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1280 });

  await page.goto('http://localhost:3000');

  const sessionButton = await page.$('#sessionButton');
  if (sessionButton) {
    await sessionButton.click();
  } else {
    console.log("The #sessionButton wasn't found.");
  }
  const startButtonVisible = await page.waitForSelector('#startButton', {
    visible: true,
  });
  console.assert(
    startButtonVisible,
    'Start button should be visible after session start'
  );

  const startButton = await page.$('#startButton');
  const svgElement = await page.$('svg');

  if (startButton && svgElement) {
    // const numIterations = maxIterations * 2;
    const numIterations = 4;
    for (let i = 0; i <= numIterations; i++) {
      await startButton.click();
      console.log('Start button clicked', i);

      // Generate a random delay between 200 and 1500
      const delay = Math.floor(Math.random() * (1500 - 200 + 1)) + 200;
      await new Promise(r => setTimeout(r, delay));

      // Check if the SVG is being displayed at the correct time
      const svgDisplay = await page.evaluate(
        el => el.style.display,
        svgElement
      );
      if (i < numIterations && svgDisplay !== 'none') {
        console.log('SVG is displayed at the correct time');
      } else if (i === numIterations && svgDisplay === 'none') {
        console.log('SVG is not displayed at the correct time');
      }
    }
  } else {
    console.log("The #startButton or the SVG wasn't found.");
  }

  await new Promise(r => setTimeout(r, 2000));

  await page.waitForFunction(
    () =>
      document.querySelector('#assistant-response-text') &&
      document
        .querySelector('#assistant-response-text')
        .innerText.includes(`Generating feedback from the assistant...`),
    { timeout: 5000 }
  );
  // Close the browser after short delay
  // await new Promise(r => setTimeout(r, 2500));
  // await browser.close();
}

runTest().catch(error => console.error('Test failed:', error));
