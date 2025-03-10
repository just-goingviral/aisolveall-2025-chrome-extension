/**
 * Aisolveall Assistant - UI Helper
 * 
 * This module provides utility functions for UI operations.
 */

const UIHelper = {
    /**
     * Loads the CSS styles from the external file
     */
    loadStyles: function() {
      try {
        // We don't need to manually load CSS as it's now included in the manifest
        console.log("Aisolveall styles loading handled by manifest.json");
      } catch (error) {
        console.error("Error with styles:", error);
        // Fallback to inline styles if needed
        this.createFallbackStyles();
      }
    },
    
    /**
     * Creates fallback inline styles if the external CSS file cannot be loaded
     */
    createFallbackStyles: function() {
      const styleEl = document.createElement("style");
      styleEl.textContent = `
        #aisolveall-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 350px;
          height: 100%;
          background-color: #fff;
          border-left: 1px solid #ccc;
          z-index: 10000;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          overflow: auto;
          resize: horizontal;
          padding: 10px;
          font-family: sans-serif;
        }
        #aisolveall-sidebar.dark-mode {
          background-color: #333;
          color: #fff;
        }
        #aisolveall-sidebar.dark-mode button,
        #aisolveall-sidebar.dark-mode select,
        #aisolveall-sidebar.dark-mode input,
        #aisolveall-sidebar.dark-mode textarea {
          background-color: #444;
          color: #fff;
        }
        #aisolveall-chat-button {
          position: fixed;
          bottom: 10px;
          right: 10px;
          z-index: 10000;
          padding: 10px 20px;
          background-color: #4285f4;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(styleEl);
      console.log("Fallback styles applied");
    },
    
    /**
     * Shows an error message to the user
     * @param {string} message - The error message to display
     */
    showError: function(message) {
      alert(message);
    },
    
    /**
     * Shows a success message to the user
     * @param {string} message - The success message to display
     */
    showSuccess: function(message) {
      // Could be enhanced with a custom toast notification
      alert(message);
    },
    
    /**
     * Creates a DOM element with attributes and event listeners
     * @param {string} tagName - The HTML tag name
     * @param {object} options - Options including className, id, attributes, style, and text
     * @param {object} events - Event listeners to add
     * @returns {HTMLElement} The created element
     */
    createElement: function(tagName, options = {}, events = {}) {
      const element = document.createElement(tagName);
      
      if (options.className) element.className = options.className;
      if (options.id) element.id = options.id;
      if (options.text) element.textContent = options.text;
      
      // Add attributes
      if (options.attributes) {
        Object.keys(options.attributes).forEach(key => {
          element.setAttribute(key, options.attributes[key]);
        });
      }
      
      // Add inline styles
      if (options.style) {
        Object.keys(options.style).forEach(key => {
          element.style[key] = options.style[key];
        });
      }
      
      // Add event listeners
      Object.keys(events).forEach(eventName => {
        element.addEventListener(eventName, events[eventName]);
      });
      
      return element;
    },
    
    /**
     * Sanitizes text for voice output
     * @param {string} text - The text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeTextForVoice: function(text) {
      try {
        console.log("Sanitizing text for voice output.");
        
        // Remove Markdown and other special characters
        let sanitized = text.replace(/[\*\_\~\[\]]/g, "");
        
        // Convert line breaks to spaces
        sanitized = sanitized.replace(/(\r\n|\n|\r)/gm, " ");
        
        // Remove multiple spaces
        sanitized = sanitized.replace(/\s\s+/g, " ");
        
        return sanitized.trim();
      } catch (error) {
        console.error("Error sanitizing text:", error);
        return text;
      }
    },
    
    /**
     * Extract document ID from Google Docs URL
     * @param {string} url - The URL to parse
     * @returns {string|null} The document ID or null
     */
    extractDocIdFromUrl: function(url) {
      try {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
      } catch (error) {
        console.error("Error extracting Google Doc ID:", error);
        return null;
      }
    },
    
    /**
     * Shows a loading indicator
     * @param {HTMLElement} element - The element to show loading in
     * @param {string} message - Optional loading message
     */
    showLoading: function(element, message = "Loading...") {
      if (element) {
        // Store original content to restore later
        element.dataset.originalContent = element.innerHTML;
        
        // Add spinner and message
        element.innerHTML = `
          <span class="loading-spinner"></span>
          <span class="loading-message">${message}</span>
        `;
      }
    },
    
    /**
     * Hides loading indicator and restores original content
     * @param {HTMLElement} element - The element to hide loading from
     */
    hideLoading: function(element) {
      if (element && element.dataset.originalContent) {
        element.innerHTML = element.dataset.originalContent;
        delete element.dataset.originalContent;
      }
    },
    
    /**
     * Copies text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    copyToClipboard: async function(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        
        // Fallback method
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          const success = document.execCommand("copy");
          document.body.removeChild(textarea);
          return success;
        } catch (err) {
          console.error("Fallback clipboard copy failed:", err);
          document.body.removeChild(textarea);
          return false;
        }
      }
    }
  };