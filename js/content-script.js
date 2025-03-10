/**
 * Aisolveall Assistant - Content Script
 * 
 * This is the main entry point of the content script that initializes the application.
 * It's kept minimal and delegates initialization to the core app module.
 */

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    if (typeof AisolveallApp !== 'undefined' && AisolveallApp.init) {
      AisolveallApp.init();
    } else {
      console.error('Aisolveall Assistant: Failed to initialize - core module not loaded correctly');
    }
  });
  
  // Fallback initialization if DOMContentLoaded has already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      if (typeof AisolveallApp !== 'undefined' && AisolveallApp.init) {
        AisolveallApp.init();
      }
    }, 1);
  }