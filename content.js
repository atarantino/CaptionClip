// Wrap in IIFE to avoid redeclaration errors when re-injected
(function() {
  console.log('CaptionClip: Content script loaded');
  
  // Check if already initialized
  if (window.__transcriptExtractorInitialized) {
    console.log('CaptionClip: Already initialized, skipping');
    return;
  }
  window.__transcriptExtractorInitialized = true;
  console.log('CaptionClip: Initializing...');

  // Use browser API for Firefox compatibility
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

  // Function to inject the CaptionClip button
  function injectCaptionClipButton() {
    console.log('CaptionClip: injectCaptionClipButton called');
    console.log('CaptionClip: Current URL:', window.location.href);
    
    // Check if we're on a YouTube video page
    if (!window.location.href.includes('youtube.com/watch')) {
      console.log('CaptionClip: Not on a video page, skipping injection');
      return;
    }

    // Check if button already exists
    if (document.getElementById('captionclip-button')) {
      console.log('CaptionClip: Button already exists');
      return;
    }

    console.log('CaptionClip: Starting to look for action buttons container...');
    
    // Wait for the voice search button to load in the top navigation
    const checkForVoiceSearchButton = setInterval(() => {
      console.log('CaptionClip: Looking for voice search button...');
      
      // Look for the voice search button in the top navigation
      const voiceSearchButton = document.querySelector('#voice-search-button');
      
      if (voiceSearchButton) {
        clearInterval(checkForVoiceSearchButton);
        console.log('CaptionClip: Found voice search button, injecting CaptionClip button...');
        
        // Create a button that visually matches the Create button using standard HTML
        const captionClipButton = document.createElement('button');
        captionClipButton.id = 'captionclip-button';
        captionClipButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading';
        captionClipButton.setAttribute('aria-label', 'Extract transcript with CaptionClip');
        captionClipButton.setAttribute('title', 'Extract transcript with CaptionClip');
        captionClipButton.style.cssText = `
          display: inline-flex !important;
          align-items: center !important;
          margin-left: 8px !important;
          background: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1)) !important;
          backdrop-filter: blur(2px) !important;
          border: none !important;
          border-radius: 18px !important;
          padding: 0 8px !important;
          height: 36px !important;
          font-family: Roboto, Arial, sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--yt-spec-text-primary) !important;
          cursor: pointer !important;
          transition: background-color 0.3s ease, color 0.3s ease !important;
          min-width: auto !important;
          max-width: 120px !important;
        `;
        
        // Create icon container
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
          display: flex !important;
          align-items: center !important;
          margin-right: 4px !important;
          width: 20px !important;
          height: 20px !important;
        `;
        
        // Create SVG icon
        iconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" style="fill: currentColor;">
            <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
          </svg>
        `;
        
        // Create text container
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Transcript';
        textSpan.style.cssText = 'white-space: nowrap !important;';
        
        // Add hover effects
        captionClipButton.onmouseenter = () => {
          captionClipButton.style.setProperty('background', 'var(--yt-spec-badge-chip-background-hover, rgba(255, 255, 255, 0.2))', 'important');
        };
        captionClipButton.onmouseleave = () => {
          captionClipButton.style.setProperty('background', 'var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1))', 'important');
        };
        
        // Assemble the button
        captionClipButton.appendChild(iconContainer);
        captionClipButton.appendChild(textSpan);
        
        // Add click handler
        captionClipButton.addEventListener('click', async () => {
          captionClipButton.disabled = true;
          const originalText = textSpan.textContent;
          textSpan.textContent = 'Extracting...';
          
          try {
            const transcript = await openAndExtractTranscript();
            
            // Copy to clipboard
            await copyToClipboard(transcript);
            
            // Show success
            textSpan.textContent = '✓ Copied!';
            captionClipButton.style.setProperty('background', '#4caf50', 'important');
            captionClipButton.style.setProperty('color', 'white', 'important');
            
            // Start fade out after 2 seconds, then reset text after fade completes
            setTimeout(() => {
              captionClipButton.style.setProperty('background', 'var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1))', 'important');
              captionClipButton.style.setProperty('color', 'var(--yt-spec-text-primary)', 'important');
              
              // Wait for transition to complete before changing text
              setTimeout(() => {
                textSpan.textContent = originalText;
                captionClipButton.disabled = false;
              }, 300); // Match the transition duration
            }, 2000);
            
          } catch (error) {
            console.error('Error:', error);
            textSpan.textContent = '✗ Failed';
            captionClipButton.style.setProperty('background', '#f44336', 'important');
            captionClipButton.style.setProperty('color', 'white', 'important');
            
            // Show error toast
            showToast(`Error: ${error.message}`, 'error');
            
            // Start fade out after 2 seconds, then reset text after fade completes
            setTimeout(() => {
              captionClipButton.style.setProperty('background', 'var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1))', 'important');
              captionClipButton.style.setProperty('color', 'var(--yt-spec-text-primary)', 'important');
              
              // Wait for transition to complete before changing text
              setTimeout(() => {
                textSpan.textContent = originalText;
                captionClipButton.disabled = false;
              }, 300); // Match the transition duration
            }, 2000);
          }
        });
        
        // Insert the button next to the voice search button
        const voiceSearchContainer = voiceSearchButton.parentElement;
        if (voiceSearchContainer) {
          // Insert after the voice search button
          voiceSearchContainer.insertBefore(captionClipButton, voiceSearchButton.nextSibling);
          console.log('CaptionClip: Button inserted next to voice search button');
        } else {
          // Fallback: insert after the voice search button directly
          voiceSearchButton.parentNode.insertBefore(captionClipButton, voiceSearchButton.nextSibling);
          console.log('CaptionClip: Button inserted after voice search button (fallback)');
        }
        
        console.log('CaptionClip button injected successfully');
      }
    }, 1000);
    
    // Stop checking after 30 seconds
    setTimeout(() => clearInterval(checkForVoiceSearchButton), 30000);
  }

  // Function to copy text to clipboard
  async function copyToClipboard(text) {
    try {
      // Try modern Clipboard API first (this requires user interaction)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (e) {
      console.log('Clipboard API failed, trying fallback:', e);
    }
    
    // Fallback to execCommand with improved focus handling
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 1px;
      height: 1px;
      padding: 0;
      border: none;
      outline: none;
      box-shadow: none;
      background: transparent;
      z-index: -1;
    `;
    
    document.body.appendChild(textarea);
    
    // Ensure the textarea is focused and selected
    textarea.focus();
    textarea.select();
    
    // For mobile devices and better compatibility
    if (textarea.setSelectionRange) {
      textarea.setSelectionRange(0, textarea.value.length);
    }
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (copyError) {
      console.error('execCommand copy failed:', copyError);
    }
    
    document.body.removeChild(textarea);
    
    if (!success) {
      throw new Error('Failed to copy to clipboard');
    }
  }

  // Function to show toast notifications
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc2626' : '#16a34a'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
      }, 300);
    }, 3000);
  }

  // Listen for messages from the popup/background script
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_transcript") {
      console.log("Received extract_transcript request");
      
      // Also try to inject the button when extract is called
      console.log("Attempting to inject button during extract...");
      injectCaptionClipButton();
      
      openAndExtractTranscript()
        .then(transcript => {
          console.log("Extraction successful, length:", transcript.length);
          sendResponse({ transcript: transcript });
        })
        .catch(error => {
          console.error("Error extracting transcript:", error);
          sendResponse({ error: error.toString() });
        });
      return true; // Required for async sendResponse
    }
    
    // Manual trigger for button injection debugging
    if (request.action === "inject_button") {
      console.log("Manual button injection triggered");
      injectCaptionClipButton();
      sendResponse({ success: true });
    }
  });

  // Inject button on page load
  console.log('CaptionClip: Calling injectCaptionClipButton on page load');
  console.log('CaptionClip: Current page URL:', window.location.href);
  console.log('CaptionClip: Document ready state:', document.readyState);
  
  // Try injecting immediately
  injectCaptionClipButton();
  
  // Also try after a delay to ensure DOM is ready
  setTimeout(() => {
    console.log('CaptionClip: Delayed injection after 2 seconds');
    injectCaptionClipButton();
  }, 2000);

  // Re-inject button on navigation (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('CaptionClip: Navigation detected, re-injecting button after 1s');
      setTimeout(injectCaptionClipButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

async function openAndExtractTranscript() {
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    throw new Error('Not a YouTube video page');
  }

  // Check if the transcript panel is already open
  const existingPanel = document.querySelector('ytd-transcript-search-panel-renderer');
  if (existingPanel) {
    console.log("Transcript panel already open, extracting...");
  } else {
    // Open the transcript panel if it's not already open
    console.log("Attempting to open transcript panel...");
    await tryOpenTranscriptPanel();
  }

  // Wait for transcript to load
  const segmentsContainer = await waitForElement('#segments-container', 10000)
    .catch(err => {
      throw new Error('Transcript segments not found. The video might not have a transcript available.');
    });

  // Extract transcript
  return extractYouTubeTranscript();
}

async function tryOpenTranscriptPanel() {
  // Try multiple methods to open transcript
  // Start with the most likely method (Show transcript button)
  const methods = [
    tryOpenViaShowTranscriptButton,
    tryOpenViaMoreActions,
    tryOpenViaThreeDots
  ];

  for (const method of methods) {
    try {
      const success = await method();
      if (success) {
        console.log(`Successfully opened transcript using ${method.name}`);
        return true;
      }
    } catch (e) {
      console.log(`Method ${method.name} failed:`, e.message);
    }
  }

  throw new Error('Could not open transcript panel using any method');
}

async function tryOpenViaMoreActions() {
  // Try to find the "..." menu button in the player
  console.log("Trying to open via player More actions button...");

  // Multiple possible selectors for the button
  const buttonSelectors = [
    'button.ytp-button[aria-label="More actions"]',
    'button.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]',
    'button.ytp-settings-button'
  ];

  let moreActionsButton = null;
  for (const selector of buttonSelectors) {
    const button = document.querySelector(selector);
    if (button) {
      moreActionsButton = button;
      console.log(`Found button using selector: ${selector}`);
      break;
    }
  }

  if (!moreActionsButton) {
    throw new Error('More actions button not found in player');
  }

  // Click the "..." menu button
  moreActionsButton.click();
  console.log("Clicked more actions button");

  // Wait for menu to appear
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find and click the "Show transcript" option
  const menuItems = Array.from(document.querySelectorAll('.ytp-panel-menu .ytp-menuitem, .ytp-drop-down-menu .ytp-menuitem'));
  console.log(`Found ${menuItems.length} menu items`);

  const transcriptMenuItem = menuItems.find(item => {
    const text = item.textContent.toLowerCase();
    return text.includes('transcript') || text.includes('caption');
  });

  if (!transcriptMenuItem) {
    // Close the menu by clicking elsewhere
    document.body.click();
    throw new Error('Transcript option not found in player menu');
  }

  transcriptMenuItem.click();
  console.log("Clicked transcript menu item");

  // Wait for transcript panel to open
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
}

async function tryOpenViaThreeDots() {
  console.log("Trying to open via three dots menu below video...");

  // Find the three dots menu below the video
  const menuButtons = Array.from(document.querySelectorAll('button'));
  const moreButton = menuButtons.find(button => {
    const ariaLabel = button.getAttribute('aria-label');
    return ariaLabel && ariaLabel.includes('More actions') && !button.classList.contains('ytp-button');
  });

  if (!moreButton) {
    throw new Error('More button not found below video');
  }

  moreButton.click();
  console.log("Clicked more button below video");

  // Wait for menu to appear
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Look for Show transcript in the dropdown
  const menuItems = Array.from(document.querySelectorAll('tp-yt-paper-listbox tp-yt-paper-item, ytd-menu-service-item-renderer'));
  console.log(`Found ${menuItems.length} menu items in dropdown`);

  const transcriptItem = menuItems.find(item => item.textContent.toLowerCase().includes('transcript'));

  if (!transcriptItem) {
    // Close the menu by clicking elsewhere
    document.body.click();
    throw new Error('Transcript option not found in dropdown menu');
  }

  transcriptItem.click();
  console.log("Clicked transcript item in dropdown");

  // Wait for transcript panel to open
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
}

async function tryOpenViaShowTranscriptButton() {
  console.log("Trying to find direct Show Transcript button...");

  // Look for the Show transcript button in the video description area
  // First try the specific selector for the transcript section button
  const transcriptButton = document.querySelector('ytd-video-description-transcript-section-renderer button[aria-label="Show transcript"]');
  
  if (transcriptButton) {
    console.log("Found transcript button via aria-label");
    transcriptButton.click();
    // Wait for transcript panel to open
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }

  // Fallback: Look for buttons containing "transcript" text
  const buttons = Array.from(document.querySelectorAll('button, yt-button-renderer button, ytd-button-renderer button'));

  for (const button of buttons) {
    const text = button.textContent.toLowerCase();
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    if (text.includes('transcript') || text.includes('show transcript') || 
        ariaLabel.includes('transcript') || ariaLabel.includes('show transcript')) {
      console.log("Found direct transcript button:", text || ariaLabel);
      button.click();

      // Wait for transcript panel to open
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    }
  }

  throw new Error('Direct transcript button not found');
}

function extractYouTubeTranscript() {
  // Get all transcript segments
  const segmentsContainer = document.getElementById('segments-container');
  if (!segmentsContainer) {
    return "Transcript container not found.";
  }

  // Get all transcript segments
  const segments = segmentsContainer.querySelectorAll('ytd-transcript-segment-renderer');
  console.log(`Found ${segments.length} transcript segments`);

  if (segments.length === 0) {
    return "No transcript segments found. The video might not have a transcript.";
  }

  // Extract text from each segment
  const transcriptParts = [];
  segments.forEach(segment => {
    const textElement = segment.querySelector('div > yt-formatted-string');
    if (textElement) {
      transcriptParts.push(textElement.textContent.trim());
    }
  });

  // Join all parts with spaces
  return transcriptParts.join(' ');
}

// Helper function to wait for an element to appear
function waitForElement(selector, timeout = 10000) {
  console.log(`Waiting for element: ${selector}`);
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    if (document.querySelector(selector)) {
      console.log(`Element ${selector} already exists`);
      resolve(document.querySelector(selector));
      return;
    }

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Element ${selector} found after ${Date.now() - startTime}ms`);
        resolve(element);
        return;
      }

      if (Date.now() - startTime > timeout) {
        console.log(`Timeout waiting for element: ${selector}`);
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }

      setTimeout(checkElement, 300);
    };

    checkElement();
  });
}

})();