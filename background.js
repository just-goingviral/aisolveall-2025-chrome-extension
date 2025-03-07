// Initialize the extension on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Aisolveall Assistant installed");
    
    // Create a context menu item for summarizing text
    chrome.contextMenus.create({
      id: "summarize",
      title: "Summarize with Aisolveall",
      contexts: ["selection"]
    });
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
  
  chrome.action.onClicked.addListener((tab) => {
    // First check if we can inject the content script
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      files: ['content.js']
    }).then(() => {
      // Now that we're sure the script is loaded, send the message
      chrome.tabs.sendMessage(tab.id, {action: "toggleSidebar"});
    }).catch(err => console.error(err));
  });
  
  // Handle messages from content scripts or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callOpenAI") {
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${request.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || "gpt-3.5-turbo",
          messages: [{ role: "user", content: request.prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
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
  });