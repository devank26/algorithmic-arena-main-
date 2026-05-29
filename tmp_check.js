const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:8080/graph');
  
  // Click the Floyd Warshall button
  await page.click('button:has-text("Floyd-Warshall")');
  
  // Wait to see if error occurs
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
