(function() {
  if (window.__transcriptExtractorInitialized) {
    return;
  }
  window.__transcriptExtractorInitialized = true;


  function injectCaptionClipButton() {
    if (!window.location.href.includes('youtube.com/watch')) {
      return;
    }

    if (document.getElementById('captionclip-button')) {
      return;
    }
    
    // Remove existing settings panel if present
    const existingPanel = document.getElementById('captionclip-settings-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    const checkForVoiceSearchButton = setInterval(() => {
      const voiceSearchButton = document.querySelector('#voice-search-button');
      
      if (voiceSearchButton) {
        clearInterval(checkForVoiceSearchButton);
        
        const htmlElement = document.documentElement;
        const bodyElement = document.body;
        const bodyStyles = window.getComputedStyle(bodyElement);
        const htmlStyles = window.getComputedStyle(htmlElement);
        
        let isDarkTheme = false;
        
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
          isDarkTheme = ytdApp.hasAttribute('dark') || 
                       ytdApp.getAttribute('theme') === 'dark' ||
                       ytdApp.classList.contains('dark');
        }
        
        if (!isDarkTheme) {
          isDarkTheme = htmlElement.hasAttribute('dark') || 
                       htmlElement.getAttribute('theme') === 'dark' ||
                       htmlElement.classList.contains('dark') ||
                       bodyElement.getAttribute('theme') === 'dark' ||
                       bodyElement.classList.contains('dark');
        }
        
        if (!isDarkTheme) {
          const topBar = document.querySelector('#masthead, #container.ytd-masthead');
          if (topBar) {
            const topBarStyles = window.getComputedStyle(topBar);
            const topBarBg = topBarStyles.backgroundColor;
            isDarkTheme = topBarBg.includes('33, 33, 33') || 
                         topBarBg.includes('24, 24, 24') || 
                         topBarBg.includes('15, 15, 15') ||
                         topBarBg.includes('35, 35, 35');
          }
        }
        
        if (!isDarkTheme) {
          isDarkTheme = bodyStyles.backgroundColor.includes('24, 24, 24') ||
                       bodyStyles.backgroundColor.includes('15, 15, 15') ||
                       htmlStyles.backgroundColor.includes('24, 24, 24') ||
                       htmlStyles.backgroundColor.includes('15, 15, 15');
        }
        
        // Create container for button and settings
        const captionClipContainer = document.createElement('div');
        captionClipContainer.id = 'captionclip-container';
        captionClipContainer.style.cssText = `
          display: inline-flex !important;
          align-items: center !important;
          position: relative !important;
          margin-left: 8px !important;
        `;
        
        const captionClipButton = document.createElement('button');
        captionClipButton.id = 'captionclip-button';
        captionClipButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading';
        captionClipButton.setAttribute('aria-label', 'Extract transcript with CaptionClip');
        captionClipButton.setAttribute('title', 'Extract transcript with CaptionClip');
        
        const buttonStyles = isDarkTheme ? {
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          hoverBackground: 'rgba(255, 255, 255, 0.2)'
        } : {
          background: 'rgba(0, 0, 0, 0.05)',
          color: '#030303',
          hoverBackground: 'rgba(0, 0, 0, 0.1)'
        };
        
        captionClipButton.style.cssText = `
          display: inline-flex !important;
          align-items: center !important;
          background: ${buttonStyles.background} !important;
          backdrop-filter: blur(2px) !important;
          border: none !important;
          border-radius: 18px !important;
          padding: 0 8px !important;
          height: 36px !important;
          font-family: Roboto, Arial, sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: ${buttonStyles.color} !important;
          cursor: pointer !important;
          transition: background-color 0.3s ease, color 0.3s ease !important;
          min-width: auto !important;
          max-width: 120px !important;
        `;
        
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
          display: flex !important;
          align-items: center !important;
          margin-right: 4px !important;
          width: 20px !important;
          height: 20px !important;
        `;
        
        iconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" style="fill: currentColor;">
            <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
          </svg>
        `;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Transcript';
        textSpan.style.cssText = 'white-space: nowrap !important;';
        
        captionClipButton.onmouseenter = () => {
          captionClipButton.style.setProperty('background', buttonStyles.hoverBackground, 'important');
        };
        captionClipButton.onmouseleave = () => {
          captionClipButton.style.setProperty('background', buttonStyles.background, 'important');
        };
        
        captionClipButton.appendChild(iconContainer);
        captionClipButton.appendChild(textSpan);
        
        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.id = 'captionclip-settings-button';
        settingsButton.setAttribute('aria-label', 'CaptionClip settings');
        settingsButton.setAttribute('title', 'Configure custom prepend text');
        settingsButton.style.cssText = `
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: ${buttonStyles.background} !important;
          backdrop-filter: blur(2px) !important;
          border: none !important;
          border-radius: 18px !important;
          padding: 0 !important;
          width: 36px !important;
          height: 36px !important;
          margin-left: 4px !important;
          color: ${buttonStyles.color} !important;
          cursor: pointer !important;
          transition: background-color 0.3s ease, color 0.3s ease !important;
        `;
        
        settingsButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" style="fill: currentColor;">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        `;
        
        settingsButton.onmouseenter = () => {
          settingsButton.style.setProperty('background', buttonStyles.hoverBackground, 'important');
        };
        settingsButton.onmouseleave = () => {
          settingsButton.style.setProperty('background', buttonStyles.background, 'important');
        };
        
        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'captionclip-settings-panel';
        settingsPanel.style.cssText = `
          position: absolute !important;
          top: 45px !important;
          right: 0 !important;
          background: ${isDarkTheme ? '#212121' : '#ffffff'} !important;
          border: 1px solid ${isDarkTheme ? '#404040' : '#e0e0e0'} !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          z-index: 9999 !important;
          min-width: 280px !important;
          display: none !important;
          font-family: Roboto, Arial, sans-serif !important;
        `;
        
        const settingsLabel = document.createElement('label');
        settingsLabel.textContent = 'Custom prepend text:';
        settingsLabel.style.cssText = `
          display: block !important;
          margin-bottom: 6px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          color: ${isDarkTheme ? '#e0e0e0' : '#303030'} !important;
        `;
        
        const settingsInput = document.createElement('input');
        settingsInput.type = 'text';
        settingsInput.placeholder = 'e.g., "Summarize this:", "Key points:"';
        settingsInput.value = localStorage.getItem('captionclip-prepend') || '';
        settingsInput.style.cssText = `
          width: 100% !important;
          padding: 8px !important;
          border: 1px solid ${isDarkTheme ? '#404040' : '#d0d0d0'} !important;
          border-radius: 4px !important;
          background: ${isDarkTheme ? '#303030' : '#ffffff'} !important;
          color: ${isDarkTheme ? '#e0e0e0' : '#303030'} !important;
          font-size: 13px !important;
          font-family: inherit !important;
          box-sizing: border-box !important;
          margin-bottom: 8px !important;
        `;
        
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = `
          display: flex !important;
          gap: 8px !important;
          justify-content: flex-end !important;
        `;
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
          padding: 6px 12px !important;
          background: #1976d2 !important;
          color: white !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
        `;
        
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.style.cssText = `
          padding: 6px 12px !important;
          background: ${isDarkTheme ? '#404040' : '#f0f0f0'} !important;
          color: ${isDarkTheme ? '#e0e0e0' : '#303030'} !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
        `;
        
        buttonRow.appendChild(clearButton);
        buttonRow.appendChild(saveButton);
        settingsPanel.appendChild(settingsLabel);
        settingsPanel.appendChild(settingsInput);
        settingsPanel.appendChild(buttonRow);
        
        // Settings button click handler
        settingsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const isVisible = settingsPanel.style.display !== 'none';
          settingsPanel.style.display = isVisible ? 'none' : 'block';
          if (!isVisible) {
            settingsInput.focus();
          }
        });
        
        // Save button handler
        saveButton.addEventListener('click', () => {
          const value = settingsInput.value.trim();
          localStorage.setItem('captionclip-prepend', value);
          settingsPanel.style.display = 'none';
          updateButtonText();
        });
        
        // Clear button handler
        clearButton.addEventListener('click', () => {
          settingsInput.value = '';
          localStorage.removeItem('captionclip-prepend');
          settingsPanel.style.display = 'none';
          updateButtonText();
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
          if (!captionClipContainer.contains(e.target)) {
            settingsPanel.style.display = 'none';
          }
        });
        
        // Function to update button text based on custom prepend
        function updateButtonText() {
          const customPrepend = localStorage.getItem('captionclip-prepend');
          if (customPrepend && customPrepend.trim()) {
            textSpan.textContent = 'Custom';
            captionClipButton.setAttribute('title', `Extract transcript with custom prepend: "${customPrepend}"`);
          } else {
            textSpan.textContent = 'Transcript';
            captionClipButton.setAttribute('title', 'Extract transcript with CaptionClip');
          }
        }
        
        // Initialize button text
        updateButtonText();
        
        captionClipButton.addEventListener('click', async () => {
          captionClipButton.disabled = true;
          const originalText = textSpan.textContent;
          textSpan.textContent = 'Extracting...';
          
          try {
            const transcript = await openAndExtractTranscript();
            const customPrepend = localStorage.getItem('captionclip-prepend');
            const finalTranscript = customPrepend && customPrepend.trim() 
              ? `${customPrepend.trim()} ${transcript}`
              : transcript;
            
            await copyToClipboard(finalTranscript);
            
            textSpan.textContent = '✓ Copied!';
            captionClipButton.style.setProperty('background', '#4caf50', 'important');
            captionClipButton.style.setProperty('color', 'white', 'important');
            
            setTimeout(() => {
              captionClipButton.style.setProperty('background', buttonStyles.background, 'important');
              captionClipButton.style.setProperty('color', buttonStyles.color, 'important');
              
              setTimeout(() => {
                textSpan.textContent = originalText;
                captionClipButton.disabled = false;
              }, 300);
            }, 2000);
            
          } catch (error) {
            textSpan.textContent = '✗ Failed';
            captionClipButton.style.setProperty('background', '#f44336', 'important');
            captionClipButton.style.setProperty('color', 'white', 'important');
            
            showToast(`Error: ${error.message}`, 'error');
            
            setTimeout(() => {
              captionClipButton.style.setProperty('background', buttonStyles.background, 'important');
              captionClipButton.style.setProperty('color', buttonStyles.color, 'important');
              
              setTimeout(() => {
                textSpan.textContent = originalText;
                captionClipButton.disabled = false;
              }, 300);
            }, 2000);
          }
        });
        
        // Add elements to container
        captionClipContainer.appendChild(captionClipButton);
        captionClipContainer.appendChild(settingsButton);
        captionClipContainer.appendChild(settingsPanel);
        
        const voiceSearchContainer = voiceSearchButton.parentElement;
        if (voiceSearchContainer) {
          voiceSearchContainer.insertBefore(captionClipContainer, voiceSearchButton.nextSibling);
        } else {
          voiceSearchButton.parentNode.insertBefore(captionClipContainer, voiceSearchButton.nextSibling);
        }
      }
    }, 1000);
    
    setTimeout(() => clearInterval(checkForVoiceSearchButton), 30000);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (e) {
    }
    
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
    
    textarea.focus();
    textarea.select();
    
    if (textarea.setSelectionRange) {
      textarea.setSelectionRange(0, textarea.value.length);
    }
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (copyError) {
    }
    
    document.body.removeChild(textarea);
    
    if (!success) {
      throw new Error('Failed to copy to clipboard');
    }
  }

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


  injectCaptionClipButton();
  
  setTimeout(() => {
    injectCaptionClipButton();
  }, 2000);

  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(injectCaptionClipButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

async function openAndExtractTranscript() {
  if (!window.location.href.includes('youtube.com/watch')) {
    throw new Error('Not a YouTube video page');
  }

  const existingPanel = document.querySelector('ytd-transcript-search-panel-renderer');
  if (!existingPanel) {
    await tryOpenTranscriptPanel();
  }

  const segmentsContainer = await waitForElement('#segments-container', 10000)
    .catch(err => {
      throw new Error('Transcript segments not found. The video might not have a transcript available.');
    });

  return extractYouTubeTranscript();
}

async function tryOpenTranscriptPanel() {
  try {
    const success = await tryOpenViaShowTranscriptButton();
    if (success) {
      return true;
    }
  } catch (e) {
  }

  throw new Error('Could not open transcript panel');
}


async function tryOpenViaShowTranscriptButton() {
  const transcriptButton = document.querySelector('ytd-video-description-transcript-section-renderer button[aria-label="Show transcript"]');
  
  if (transcriptButton) {
    transcriptButton.click();
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  }

  const buttons = Array.from(document.querySelectorAll('button, yt-button-renderer button, ytd-button-renderer button'));

  for (const button of buttons) {
    const text = button.textContent.toLowerCase();
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    if (text.includes('transcript') || text.includes('show transcript') || 
        ariaLabel.includes('transcript') || ariaLabel.includes('show transcript')) {
      button.click();

      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    }
  }

  throw new Error('Direct transcript button not found');
}

function extractYouTubeTranscript() {
  const segmentsContainer = document.getElementById('segments-container');
  if (!segmentsContainer) {
    return "Transcript container not found.";
  }

  const segments = segmentsContainer.querySelectorAll('ytd-transcript-segment-renderer');

  if (segments.length === 0) {
    return "No transcript segments found. The video might not have a transcript.";
  }

  const transcriptParts = [];
  segments.forEach(segment => {
    const textElement = segment.querySelector('div > yt-formatted-string');
    if (textElement) {
      transcriptParts.push(textElement.textContent.trim());
    }
  });

  return transcriptParts.join(' ');
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    if (document.querySelector(selector)) {
      resolve(document.querySelector(selector));
      return;
    }

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for element: ${selector}`));
        return;
      }

      setTimeout(checkElement, 300);
    };

    checkElement();
  });
}

})();