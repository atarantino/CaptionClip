// Wrap in IIFE to avoid redeclaration errors when re-injected
(function() {
  // Check if already initialized
  if (window.__transcriptExtractorInitialized) {
    return;
  }
  window.__transcriptExtractorInitialized = true;

  // Use browser API for Firefox compatibility
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

  // Listen for messages from the popup
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_transcript") {
    console.log("Received extract_transcript request");
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
});

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
