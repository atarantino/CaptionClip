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
        const copyResult = await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (text) => {
            try {
              // Try modern Clipboard API first
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'clipboard-api' };
              }
            } catch (e) {
              console.log('Clipboard API failed, trying fallback:', e);
            }
            
            // Fallback to execCommand
            try {
              const textarea = document.createElement('textarea');
              textarea.value = text;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              textarea.style.pointerEvents = 'none';
              textarea.style.zIndex = '-1';
              document.body.appendChild(textarea);
              
              // Focus the textarea
              textarea.focus();
              textarea.select();
              
              // Try to select all text
              textarea.setSelectionRange(0, textarea.value.length);
              
              // Execute copy command
              const success = document.execCommand('copy');
              document.body.removeChild(textarea);
              
              if (!success) {
                throw new Error('execCommand copy failed');
              }
              
              return { success: true, method: 'execCommand' };
            } catch (e) {
              console.error('Copy fallback failed:', e);
              return { success: false, error: e.message };
            }
          },
          args: [response.transcript]
        });
      } else if (browserAPI.tabs.executeScript) {
        // Firefox Manifest V2
        const copyResult = await browserAPI.tabs.executeScript(tab.id, {
          code: `
            (async function(text) {
              try {
                // Try modern Clipboard API first
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(text);
                  return { success: true, method: 'clipboard-api' };
                }
              } catch (e) {
                console.log('Clipboard API failed, trying fallback:', e);
              }
              
              // Fallback to execCommand
              try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.pointerEvents = 'none';
                textarea.style.zIndex = '-1';
                document.body.appendChild(textarea);
                
                // Focus the textarea
                textarea.focus();
                textarea.select();
                
                // Try to select all text
                textarea.setSelectionRange(0, textarea.value.length);
                
                // Execute copy command
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (!success) {
                  throw new Error('execCommand copy failed');
                }
                
                return { success: true, method: 'execCommand' };
              } catch (e) {
                console.error('Copy fallback failed:', e);
                return { success: false, error: e.message };
              }
            })(${JSON.stringify(response.transcript)});
          `
        });
      }
      
      // Check if copy was successful
      let copySuccess = false;
      if (browserAPI.scripting && copyResult && copyResult[0] && copyResult[0].result) {
        copySuccess = copyResult[0].result.success;
        if (!copySuccess) {
          console.error('Copy failed:', copyResult[0].result.error);
        } else {
          console.log('Copy successful using method:', copyResult[0].result.method);
        }
      } else if (browserAPI.tabs.executeScript && copyResult && copyResult[0]) {
        copySuccess = copyResult[0].success;
        if (!copySuccess) {
          console.error('Copy failed:', copyResult[0].error);
        } else {
          console.log('Copy successful using method:', copyResult[0].method);
        }
      }

      // Show appropriate toast based on copy result
      if (copySuccess) {
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
      } else {
        // Show error toast when copy fails
        const showCopyFailedToast = () => {
          const toast = document.createElement('div');
          toast.textContent = '❌ Failed to copy transcript. Please try selecting and copying manually.';
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
          }, 5000); // Show for longer since it's an error
        };
        
        if (browserAPI.scripting) {
          await browserAPI.scripting.executeScript({
            target: { tabId: tab.id },
            func: showCopyFailedToast
          });
        } else if (browserAPI.tabs.executeScript) {
          await browserAPI.tabs.executeScript(tab.id, {
            code: `(${showCopyFailedToast.toString()})();`
          });
        }
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