const fs = require('fs');
const path = require('path');

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function loadContentScript(browserName) {
  return fs.readFileSync(path.join(__dirname, '..', 'dist', browserName, 'content.js'), 'utf8');
}

async function installClipboardStub(page) {
  await page.evaluate(() => {
    window.__captionclipCopiedText = null;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async text => {
          window.__captionclipCopiedText = text;
        }
      }
    });
  });
}

async function waitForCopiedTranscript(page, timeout = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const copiedLength = await page.evaluate(() => window.__captionclipCopiedText ? window.__captionclipCopiedText.length : 0);
    if (copiedLength > 100) {
      return copiedLength;
    }

    await page.waitForTimeout(500);
  }

  throw new Error('Transcript was not copied');
}

async function validateCaptionClip(page) {
  const button = await page.waitForSelector('#captionclip-button', { timeout: 15000 });
  if (!button) {
    throw new Error('CaptionClip button not found');
  }

  const buttonInfo = await page.evaluate(() => {
    const btn = document.querySelector('#captionclip-button');
    const styles = window.getComputedStyle(btn);
    return {
      visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
      background: styles.backgroundColor,
      borderColor: styles.borderColor,
      borderStyle: styles.borderStyle,
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

  if (buttonInfo.borderStyle === 'none' || /rgba\(0,\s*0,\s*0,\s*0\)/.test(buttonInfo.borderColor)) {
    throw new Error('CaptionClip button does not have a visible border');
  }

  await page.click('#captionclip-button');
  await waitForCopiedTranscript(page);

  const extractionInfo = await page.evaluate(() => ({
    copiedLength: window.__captionclipCopiedText.length,
    copiedSample: window.__captionclipCopiedText.slice(0, 120),
    modernSegmentCount: document.querySelectorAll('transcript-segment-view-model, .ytwTranscriptSegmentViewModelHost').length
  }));

  if (extractionInfo.modernSegmentCount === 0) {
    throw new Error('Transcript panel opened without rendered segments');
  }

  if (!/strangers to love|Never gonna/i.test(extractionInfo.copiedSample)) {
    throw new Error(`Copied transcript text looks wrong: ${extractionInfo.copiedSample}`);
  }

  return { buttonInfo, extractionInfo };
}

module.exports = {
  TEST_VIDEO_URL,
  installClipboardStub,
  loadContentScript,
  validateCaptionClip
};
