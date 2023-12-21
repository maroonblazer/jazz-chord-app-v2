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
  // Click the start button
  const startButton = await page.$('#startButton');
  const svgElement = await page.$('svg'); // select the first SVG on the page

  if (startButton && svgElement) {
    const maxIterations = 20;
    for (let i = 0; i <= maxIterations; i++) {
      // repeat 4 times
      await startButton.click();
      console.log('Start button clicked', i);
      await new Promise(r => setTimeout(r, 500));

      // Check if the SVG is being displayed at the correct time
      const svgDisplay = await page.evaluate(
        el => el.style.display,
        svgElement
      );
      if (i < maxIterations && svgDisplay !== 'none') {
        console.log('SVG is displayed at the correct time');
      } else if (i === maxIterations && svgDisplay === 'none') {
        console.log('SVG is not displayed at the correct time');
      }
    }
  } else {
    console.log("The #startButton or the SVG wasn't found.");
  }

  // Close the browser after short delay
  await new Promise(r => setTimeout(r, 7000));
  await browser.close();
}

runTest().catch(error => console.error('Test failed:', error));
