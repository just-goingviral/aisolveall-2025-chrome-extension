// Initialize the extension on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Aisolveall Assistant installed");
  
  // Create a context menu item for summarizing text
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize with Aisolveall",
    contexts: ["selection"]
  });
  
  // Load API keys
  try {
    const response = await fetch(chrome.runtime.getURL('api-keys.json'));
    if (!response.ok) {
      throw new Error(`Failed to load API keys: ${response.status} ${response.statusText}`);
    }
    
    const keys = await response.json();
    console.log('API keys loaded successfully in background script');
  } catch (error) {
    console.error('Error loading API keys in background script:', error);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "summarize",
      selectedText: info.selectionText
    });
  }
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-sidebar") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSidebar"});
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callOpenAI") {
    // Load API keys first
    fetch(chrome.runtime.getURL('api-keys.json'))
      .then(response => response.json())
      .then(keys => {
        // Now make the API call with the loaded keys
        return fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keys.openai}`
          },
          body: JSON.stringify({
            model: request.model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: request.prompt }],
            max_tokens: 500,
            temperature: 0.7
          })
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({success: true, data: data});
      })
      .catch(error => {
        sendResponse({success: false, error: error.message});
      });
    
    return true; // Important! Keeps the message channel open for async response
  }
  
  if (request.action === "getApiKey") {
    fetch(chrome.runtime.getURL('api-keys.json'))
      .then(response => response.json())
      .then(keys => {
        sendResponse({success: true, key: keys[request.provider]});
      })
      .catch(error => {
        sendResponse({success: false, error: error.message});
      });
    
    return true; // Keep the message channel open
  }
});