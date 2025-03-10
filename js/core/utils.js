/**
 * Aisolveall Assistant - Utility Functions
 * 
 * This module provides common utility functions used across the application.
 */

const Utils = {
    /**
     * Generate a unique ID
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} A unique ID
     */
    generateId: function(prefix = '') {
      return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Debounce a function to prevent multiple rapid calls
     * @param {Function} func - The function to debounce
     * @param {number} wait - The time to wait in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait = 300) {
      let timeout;
      return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },
    
    /**
     * Format a date to a readable string
     * @param {Date|string|number} date - The date to format
     * @param {boolean} includeTime - Whether to include time
     * @returns {string} Formatted date string
     */
    formatDate: function(date, includeTime = true) {
      const d = new Date(date);
      const dateStr = d.toLocaleDateString();
      
      if (includeTime) {
        return `${dateStr} ${d.toLocaleTimeString()}`;
      }
      
      return dateStr;
    },
    
    /**
     * Truncate text to a maximum length
     * @param {string} text - The text to truncate
     * @param {number} maxLength - Maximum length
     * @param {string} suffix - Suffix to add (default: "...")
     * @returns {string} Truncated text
     */
    truncateText: function(text, maxLength = 100, suffix = '...') {
      if (!text || text.length <= maxLength) {
        return text;
      }
      
      return text.substr(0, maxLength).trim() + suffix;
    },
    
    /**
     * Check if a string is a valid URL
     * @param {string} str - The string to check
     * @returns {boolean} True if valid URL
     */
    isValidUrl: function(str) {
      try {
        new URL(str);
        return true;
      } catch (e) {
        return false;
      }
    },
    
    /**
     * Log a message with timestamp and level
     * @param {string} message - The message to log
     * @param {string} level - Log level ('info', 'warn', 'error')
     */
    log: function(message, level = 'info') {
      const timestamp = new Date().toISOString();
      const prefix = '[Aisolveall]';
      
      switch (level.toLowerCase()) {
        case 'error':
          console.error(`${prefix} ${timestamp} - ${message}`);
          break;
        case 'warn':
          console.warn(`${prefix} ${timestamp} - ${message}`);
          break;
        default:
          console.log(`${prefix} ${timestamp} - ${message}`);
      }
    },
    
    /**
     * Safely store data in localStorage with error handling
     * @param {string} key - The key to store under
     * @param {any} value - The value to store
     * @returns {boolean} True if successful
     */
    safelyStoreLocalData: function(key, value) {
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
      } catch (error) {
        console.error(`Error storing data for key '${key}':`, error);
        return false;
      }
    },
    
    /**
     * Safely retrieve data from localStorage with error handling
     * @param {string} key - The key to retrieve
     * @param {any} defaultValue - Default value if key not found
     * @returns {any} Retrieved value or default
     */
    safelyGetLocalData: function(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        if (item === null) {
          return defaultValue;
        }
        
        return JSON.parse(item);
      } catch (error) {
        console.error(`Error retrieving data for key '${key}':`, error);
        return defaultValue;
      }
    }
  };