/**
 * Aisolveall Assistant - Core App Module
 * 
 * This is the main application module that initializes the extension
 * and coordinates between the different modules.
 */

// Main application namespace
const AisolveallApp = {
  // Global state
  state: {
    sidebarVisible: false,
    sidebarEl: null,
    currentAudio: null,
    activeProject: null
  },
  
  /**
   * Initialize the application
   */
  init: function() {
    console.log("Initializing Aisolveall Assistant...");
    
    // Load CSS
    UIHelper.loadStyles();
    
    // Load API keys
    ApiKeysManager.loadApiKeys().then(() => {
      console.log("API keys initialized");
      
      // Create floating button
      UIComponents.createFloatingButton();
      
      // Set up message listener
      this.setupMessageListener();
    }).catch(error => {
      console.error("Error initializing app:", error);
    });
  },
  
  /**
   * Set up message listener for background script communications
   */
  setupMessageListener: function() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Received message:", message);
      
      if (message.action === "toggleSidebar") {
        this.toggleSidebar();
      }
      
      if (message.action === "summarize" && message.selectedText) {
        this.openSidebarWithPrompt(`Summarize this article:\n\n${message.selectedText}`);
      }
    });
    
    console.log("Message listener set up");
  },
  
  /**
   * Toggle sidebar visibility
   */
  toggleSidebar: function() {
    try {
      if (this.state.sidebarVisible) {
        console.log("Hiding sidebar.");
        if (this.state.sidebarEl) this.state.sidebarEl.remove();
        this.state.sidebarVisible = false;
      } else {
        console.log("Showing sidebar.");
        this.state.sidebarEl = UIComponents.createSidebar();
        this.state.sidebarVisible = true;
      }
    } catch (error) {
      console.error("Error toggling sidebar:", error);
      UIHelper.showError("Error toggling sidebar: " + error.message);
    }
  },
  
  /**
   * Open sidebar and pre-populate prompt
   */
  openSidebarWithPrompt: function(text) {
    try {
      if (!this.state.sidebarVisible) {
        this.toggleSidebar();
      }
      
      const promptArea = document.getElementById("aiPrompt");
      if (promptArea) {
        promptArea.value = text;
        console.log("Sidebar prompt pre-populated.");
      }
    } catch (error) {
      console.error("Error opening sidebar with prompt:", error);
    }
  }
};