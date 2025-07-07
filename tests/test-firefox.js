const { firefox } = require('playwright');
const path = require('path');
const fs = require('fs');

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
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const contentScriptPath = path.join(__dirname, '..', 'dist', 'firefox', 'content.js');
    const contentScript = fs.readFileSync(contentScriptPath, 'utf8');
    await page.evaluate(contentScript);
    await page.waitForTimeout(2000);

    const button = await page.waitForSelector('#captionclip-button', { timeout: 5000 });
    if (!button) {
      throw new Error('CaptionClip button not found');
    }

    const buttonInfo = await page.evaluate(() => {
      const btn = document.querySelector('#captionclip-button');
      const styles = window.getComputedStyle(btn);
      return {
        exists: true,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        background: styles.backgroundColor,
        color: styles.color,
        text: btn.textContent.trim()
      };
    });

    if (!buttonInfo.visible) {
      throw new Error('CaptionClip button is not visible');
    }

    if (!buttonInfo.text.includes('Transcript')) {
      throw new Error(`Button text incorrect: ${buttonInfo.text}`);
    }

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