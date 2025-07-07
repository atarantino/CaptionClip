const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testChromeExtension() {
  let context;
  try {
    const pathToExtension = path.join(__dirname, '..', 'dist', 'chrome');
    
    context = await chromium.launchPersistentContext('', {
      headless: true,
      channel: 'chromium', // Use chromium channel for new headless mode with extension support
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await context.newPage();
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('#voice-search-button', { timeout: 10000 });
    
    // Wait for content script to inject and create button
    await page.waitForTimeout(5000);

    const button = await page.waitForSelector('#captionclip-button', { timeout: 15000 });
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