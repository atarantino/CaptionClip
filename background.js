// Use browser API for cross-browser compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : null);

if (!browserAPI) {
  console.error('No browser API available');
  throw new Error('Browser API not found');
}

// Firefox uses browserAction, Chrome uses action
const actionAPI = browserAPI.action || browserAPI.browserAction;

if (!actionAPI) {
  console.error('No action/browserAction API available');
  throw new Error('Action API not found');
}

actionAPI.onClicked.addListener(async (tab) => {
  // Check if we're on a YouTube video page
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
    // Show error toast on the page
    if (browserAPI.scripting) {
      await browserAPI.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const toast = document.createElement('div');
          toast.textContent = '❌ Please navigate to a YouTube video page first';
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
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
      });
    } else if (browserAPI.tabs.executeScript) {
      await browserAPI.tabs.executeScript(tab.id, {
        code: `
          (function() {
            const toast = document.createElement('div');
            toast.textContent = '❌ Please navigate to a YouTube video page first';
            toast.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: #dc2626;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              font-size: 14px;
              font-weight: 500;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              z-index: 999999;
              animation: slideIn 0.3s ease-out;
            \`;
            
            const style = document.createElement('style');
            style.textContent = \`
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
              }
            \`;
            document.head.appendChild(style);
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
              toast.style.animation = 'slideOut 0.3s ease-out forwards';
              setTimeout(() => {
                document.body.removeChild(toast);
                document.head.removeChild(style);
              }, 300);
            }, 3000);
          })();
        `
      });
    }
    return;
  }

  try {
    // Try to send message to content script
    let response;
    try {
      response = await browserAPI.tabs.sendMessage(tab.id, { action: 'extract_transcript' });
    } catch (error) {
      // Content script might not be injected yet, inject it now
      console.log('Content script not found, injecting...');
      
      // Firefox Manifest V2 uses tabs.executeScript
      if (browserAPI.tabs.executeScript) {
        await browserAPI.tabs.executeScript(tab.id, {
          file: 'content.js'
        });
      } else if (browserAPI.scripting) {
        // Chrome Manifest V3 uses scripting.executeScript
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }
      
      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Try sending message again
      response = await browserAPI.tabs.sendMessage(tab.id, { action: 'extract_transcript' });
    }
    
    if (response.error) {
      // Show error toast
      const showErrorToast = (message) => {
        const toast = document.createElement('div');
        toast.textContent = `❌ ${message}`;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc2626;
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
      };

      if (browserAPI.scripting) {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: showErrorToast,
          args: [response.error]
        });
      } else if (browserAPI.tabs.executeScript) {
        await browserAPI.tabs.executeScript(tab.id, {
          code: `(${showErrorToast.toString()})(${JSON.stringify(response.error)});`
        });
      }
    } else if (response.transcript) {
      // Copy to clipboard
      if (browserAPI.scripting) {
        // Chrome Manifest V3
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            // Create a textarea element to copy text
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          },
          args: [response.transcript]
        });
      } else if (browserAPI.tabs.executeScript) {
        // Firefox Manifest V2
        await browserAPI.tabs.executeScript(tab.id, {
          code: `
            (function(text) {
              const textarea = document.createElement('textarea');
              textarea.value = text;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
            })(${JSON.stringify(response.transcript)});
          `
        });
      }

      // Show success toast on the page
      if (browserAPI.scripting) {
        // Chrome Manifest V3
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const toast = document.createElement('div');
            toast.textContent = '✓ Transcript copied to clipboard';
            toast.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #16a34a;
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
        });
      } else if (browserAPI.tabs.executeScript) {
        // Firefox Manifest V2
        await browserAPI.tabs.executeScript(tab.id, {
          code: `
            (function() {
              const toast = document.createElement('div');
              toast.textContent = '✓ Transcript copied to clipboard';
              toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #16a34a;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 999999;
                animation: slideIn 0.3s ease-out;
              \`;
              
              const style = document.createElement('style');
              style.textContent = \`
                @keyframes slideIn {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                  from { transform: translateX(0); opacity: 1; }
                  to { transform: translateX(100%); opacity: 0; }
                }
              \`;
              document.head.appendChild(style);
              
              document.body.appendChild(toast);
              
              setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => {
                  document.body.removeChild(toast);
                  document.head.removeChild(style);
                }, 300);
              }, 3000);
            })();
          `
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    // Show error toast
    const showErrorToast = () => {
      const toast = document.createElement('div');
      toast.textContent = '❌ Failed to extract transcript. Please try again.';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
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
    };

    try {
      if (browserAPI.scripting) {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: showErrorToast
        });
      } else if (browserAPI.tabs.executeScript) {
        await browserAPI.tabs.executeScript(tab.id, {
          code: `(${showErrorToast.toString()})();`
        });
      }
    } catch (e) {
      // Fallback if we can't show toast
      console.error('Could not show error toast:', e);
    }
  }
});