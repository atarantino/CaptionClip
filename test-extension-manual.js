const { chromium } = require('playwright');
const path = require('path');

async function testExtension() {
  console.log('Starting extension test...');
  
  try {
    // Launch browser with extension
    const context = await chromium.launchPersistentContext(
      path.join(__dirname, 'temp-profile'), 
      {
        headless: false,
        args: [
          `--load-extension=${path.join(__dirname, 'dist', 'chrome')}`,
          '--disable-extensions-except=' + path.join(__dirname, 'dist', 'chrome'),
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ]
      }
    );

    const page = await context.newPage();
    
    // Navigate to a YouTube video
    console.log('Navigating to YouTube video...');
    await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if the CaptionClip button appears
    console.log('Looking for CaptionClip button...');
    const captionClipButton = await page.locator('#captionclip-button').first();
    
    if (await captionClipButton.isVisible()) {
      console.log('✓ CaptionClip button found!');
      
      // Check for settings button
      const settingsButton = await page.locator('#captionclip-settings-button').first();
      if (await settingsButton.isVisible()) {
        console.log('✓ Settings button found!');
        
        // Test settings functionality
        console.log('Testing settings panel...');
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        const settingsPanel = await page.locator('#captionclip-settings-panel').first();
        if (await settingsPanel.isVisible()) {
          console.log('✓ Settings panel opens correctly!');
          
          // Test input field
          const settingsInput = await settingsPanel.locator('input').first();
          await settingsInput.fill('Summarize this video:');
          
          // Save settings
          await settingsPanel.locator('button:has-text("Save")').click();
          await page.waitForTimeout(500);
          
          // Check if button text changed
          const buttonText = await captionClipButton.locator('span').textContent();
          if (buttonText === 'Custom') {
            console.log('✓ Button text changed to "Custom" after setting prepend text!');
          } else {
            console.log('✗ Button text did not change. Current text:', buttonText);
          }
        } else {
          console.log('✗ Settings panel did not open');
        }
      } else {
        console.log('✗ Settings button not found');
      }
    } else {
      console.log('✗ CaptionClip button not found');
    }
    
    // Keep browser open for manual inspection
    console.log('\nTest complete! Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExtension();