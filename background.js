const browserAPI = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined' ? chrome : null);

if (!browserAPI) {
  throw new Error('Browser API not found');
}

const actionAPI = browserAPI.action || browserAPI.browserAction;

if (!actionAPI) {
  throw new Error('Action API not found');
}

actionAPI.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.includes('youtube.com/watch')) {
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
    let response;
    try {
      response = await browserAPI.tabs.sendMessage(tab.id, { action: 'extract_transcript' });
    } catch (error) {
      
      if (browserAPI.tabs.executeScript) {
        await browserAPI.tabs.executeScript(tab.id, {
          file: 'content.js'
        });
      } else if (browserAPI.scripting) {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      response = await browserAPI.tabs.sendMessage(tab.id, { action: 'extract_transcript' });
    }
    
    if (response.error) {
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
      if (browserAPI.scripting) {
        const copyResult = await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (text) => {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'clipboard-api' };
              }
            } catch (e) {
            }
            
            try {
              const textarea = document.createElement('textarea');
              textarea.value = text;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              textarea.style.pointerEvents = 'none';
              textarea.style.zIndex = '-1';
              document.body.appendChild(textarea);
              
              textarea.focus();
              textarea.select();
              
              textarea.setSelectionRange(0, textarea.value.length);
              
              const success = document.execCommand('copy');
              document.body.removeChild(textarea);
              
              if (!success) {
                throw new Error('execCommand copy failed');
              }
              
              return { success: true, method: 'execCommand' };
            } catch (e) {
              return { success: false, error: e.message };
            }
          },
          args: [response.transcript]
        });
      } else if (browserAPI.tabs.executeScript) {
        const copyResult = await browserAPI.tabs.executeScript(tab.id, {
          code: `
            (async function(text) {
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(text);
                  return { success: true, method: 'clipboard-api' };
                }
              } catch (e) {
                }
              
              try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.pointerEvents = 'none';
                textarea.style.zIndex = '-1';
                document.body.appendChild(textarea);
                
                textarea.focus();
                textarea.select();
                
                textarea.setSelectionRange(0, textarea.value.length);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (!success) {
                  throw new Error('execCommand copy failed');
                }
                
                return { success: true, method: 'execCommand' };
              } catch (e) {
                  return { success: false, error: e.message };
              }
            })(${JSON.stringify(response.transcript)});
          `
        });
      }
      
      let copySuccess = false;
      if (browserAPI.scripting && copyResult && copyResult[0] && copyResult[0].result) {
        copySuccess = copyResult[0].result.success;
      } else if (browserAPI.tabs.executeScript && copyResult && copyResult[0]) {
        copySuccess = copyResult[0].success;
      }

      if (copySuccess) {
        if (browserAPI.scripting) {
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
    }
  }
});