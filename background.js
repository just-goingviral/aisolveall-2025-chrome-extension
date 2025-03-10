/**
 * Aisolveall Assistant - Background Service Worker
 * 
 * This script runs in the background and handles extension-wide functionality.
 */

// Initialize the extension on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Aisolveall Assistant installed");
  
  // Create a context menu item for summarizing text
  chrome.contextMenus.create({
    id: "summarize",
    title: "Summarize with Aisolveall",
    contexts: ["selection"]
  });
  
  // Create a context menu item for generating responses
  chrome.contextMenus.create({
    id: "generate",
    title: "Generate with Aisolveall",
    contexts: ["selection"]
  });
  
  // Create a context menu item for translating text
  chrome.contextMenus.create({
    id: "translate",
    title: "Translate with Aisolveall",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarize" && info.selectionText) {
    // Send message to content script to open sidebar with summarize prompt
    chrome.tabs.sendMessage(tab.id, {
      action: "summarize",
      selectedText: info.selectionText
    });
  }
  
  if (info.menuItemId === "generate" && info.selectionText) {
    // Send message to content script to open sidebar with generate prompt
    chrome.tabs.sendMessage(tab.id, {
      action: "openWithPrompt",
      prompt: "Generate a response based on this:",
      selectedText: info.selectionText
    });
  }
  
  if (info.menuItemId === "translate" && info.selectionText) {
    // Send message to content script to open sidebar with translate prompt
    chrome.tabs.sendMessage(tab.id, {
      action: "openWithPrompt",
      prompt: "Translate this text to:",
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
  // Handle any messages that need background script processing
  if (request.action === "getActiveTabInfo") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({
          url: tabs[0].url,
          title: tabs[0].title,
          id: tabs[0].id
        });
      } else {
        sendResponse(null);
      }
    });
    return true; // Required for async sendResponse
  }
  
  // Handle notifications
  if (request.action === "showNotification") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: request.title || "Aisolveall Assistant",
      message: request.message || ""
    });
    sendResponse({success: true});
    return true;
  }
});

// Handle browser action click (extension icon)
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: "toggleSidebar"})
    .catch(() => {
      // If content script isn't loaded yet, inject it first
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['js/content-script.js']
      }).then(() => {
        // Now we can send the message
        chrome.tabs.sendMessage(tab.id, {action: "toggleSidebar"});
      }).catch(err => {
        console.error("Error injecting content script:", err);
      });
    });
});