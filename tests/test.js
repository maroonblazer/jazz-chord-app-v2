const puppeteer = require('puppeteer');

async function runTest() {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=768,1080', '--window-position=1700,0'],
  }); // set headless: true to run without a browser UI
  const page = await browser.newPage();

  // Navigate to your app
  await page.goto('http://localhost:3000'); // replace with your app's URL

  // Perform actions, e.g., click a button
  const sessionButton = await page.$('#sessionButton');
  if (sessionButton) {
    await sessionButton.click();
  } else {
    console.log("The #sessionButton wasn't found.");
  }
  // Optionally, assert conditions, e.g., check if an element is visible
  const startButtonVisible = await page.waitForSelector('#startButton', {
    visible: true,
  });
  console.assert(
    startButtonVisible,
    'Start button should be visible after session start'
  );

  // Click the start button
  const startButton = await page.$('#startButton');
  if (startButton) {
    for (let i = 0; i <= 20; i++) {
      // repeat 4 times
      await startButton.click();
      console.log('Start button clicked', i);
      await new Promise(r => setTimeout(r, 300));
    }
  } else {
    console.log("The #startButton wasn't found.");
  }

  // Close the browser after short delay
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
}

runTest().catch(error => console.error('Test failed:', error));
