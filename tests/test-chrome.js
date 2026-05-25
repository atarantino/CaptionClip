const { chromium } = require('playwright');
const {
  TEST_VIDEO_URL,
  installClipboardStub,
  loadContentScript,
  validateCaptionClip
} = require('./helpers');

async function testChromeExtension() {
  let context;
  try {
    context = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await context.newPage();
    await page.goto(TEST_VIDEO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
    await installClipboardStub(page);
    await page.evaluate(loadContentScript('chrome'));
    await validateCaptionClip(page);

    console.log('✓ Chrome test passed');
    await context.close();
    return true;
  } catch (error) {
    console.error('✗ Chrome test failed:', error.message);
    if (context) await context.close();
    return false;
  }
}

if (require.main === module) {
  testChromeExtension().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testChromeExtension;
