const { firefox } = require('playwright');
const {
  TEST_VIDEO_URL,
  installClipboardStub,
  loadContentScript,
  validateCaptionClip
} = require('./helpers');

async function testFirefoxExtension() {
  let context;
  try {
    context = await firefox.launchPersistentContext('', {
      headless: true,
      args: ['--new-instance'],
      firefoxUserPrefs: {
        'xpinstall.signatures.required': false,
        'extensions.experiments.enabled': true
      }
    });

    const page = await context.newPage();
    await page.goto(TEST_VIDEO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
    await installClipboardStub(page);
    await page.evaluate(loadContentScript('firefox'));
    await validateCaptionClip(page);

    console.log('✓ Firefox test passed');
    await context.close();
    return true;
  } catch (error) {
    console.error('✗ Firefox test failed:', error.message);
    if (context) await context.close();
    return false;
  }
}

if (require.main === module) {
  testFirefoxExtension().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testFirefoxExtension;
