/**
 * Aisolveall Assistant - API Keys Manager
 * 
 * This module manages API keys for different services.
 */

const ApiKeysManager = {
    // Global API keys object
    API_KEYS: {},
    
    /**
     * Loads API keys from the JSON file
     * @returns {Promise<Object>} A promise that resolves with the API keys
     */
    loadApiKeys: async function() {
      try {
        // Check if we've already loaded the keys
        if (Object.keys(this.API_KEYS).length > 0) {
          console.log('API keys already loaded');
          return this.API_KEYS;
        }
        
        console.log('Loading API keys from file...');
        
        // Get URL to the keys file
        const keysUrl = chrome.runtime.getURL('api-keys.json');
        console.log('API keys URL:', keysUrl);
        
        // Fetch the keys file
        const response = await fetch(keysUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load API keys: ${response.status} ${response.statusText}`);
        }
        
        // Parse the JSON
        const keys = await response.json();
        
        // Validate keys
        if (!keys || typeof keys !== 'object') {
          throw new Error('Invalid API keys format');
        }
        
        // Set the keys to the global object
        this.API_KEYS = keys;
        
        console.log('API keys loaded successfully');
        return this.API_KEYS;
      } catch (error) {
        console.error('Error loading API keys:', error);
        
        // Set fallback keys (for development only, not for production)
        this.API_KEYS = {
          openai: '',
          anthropic: '',
          gemini: '',
          perplexity: '',
          elevenlabs: ''
        };
        
        console.warn('Using empty API keys. You need to provide real keys in api-keys.json.');
        return this.API_KEYS;
      }
    },
    
    /**
     * Gets a specific API key by provider name
     * @param {string} provider - The name of the API provider
     * @returns {Promise<string|null>} The API key or null if not found
     */
    getApiKey: async function(provider) {
      // If keys aren't loaded yet, load them
      if (Object.keys(this.API_KEYS).length === 0) {
        await this.loadApiKeys();
      }
      
      // Return the requested key
      return this.API_KEYS[provider] || null;
    },
    
    /**
     * Checks if API keys are loaded and valid
     * @returns {Promise<boolean>} True if keys are loaded and at least one is non-empty
     */
    verifyApiKeys: async function() {
      // Load keys if not already loaded
      if (Object.keys(this.API_KEYS).length === 0) {
        await this.loadApiKeys();
      }
      
      // Check if at least one key is non-empty
      return Object.values(this.API_KEYS).some(key => key && key.trim() !== '');
    },
    
    /**
     * Sets an API key for a provider
     * @param {string} provider - The provider name
     * @param {string} key - The API key
     * @returns {Promise<boolean>} Success status
     */
    setApiKey: async function(provider, key) {
      try {
        // Load keys if not already loaded
        if (Object.keys(this.API_KEYS).length === 0) {
          await this.loadApiKeys();
        }
        
        // Update the key
        this.API_KEYS[provider] = key;
        
        // Store keys in Chrome storage for backup
        chrome.storage.local.set({ apiKeys: this.API_KEYS }, () => {
          console.log(`API key for ${provider} updated`);
        });
        
        return true;
      } catch (error) {
        console.error(`Error setting API key for ${provider}:`, error);
        return false;
      }
    },
    
    /**
     * Load API keys from Chrome storage (backup)
     * @returns {Promise<boolean>} Success status
     */
    loadKeysFromStorage: function() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['apiKeys'], (result) => {
          if (result.apiKeys && typeof result.apiKeys === 'object') {
            this.API_KEYS = result.apiKeys;
            console.log('API keys loaded from Chrome storage');
            resolve(true);
          } else {
            console.log('No API keys found in Chrome storage');
            resolve(false);
          }
        });
      });
    },
    
    /**
     * Creates a sample api-keys.json file if it doesn't exist yet
     * This is for development purposes only
     */
    createSampleKeysFile: async function() {
      try {
        const keysUrl = chrome.runtime.getURL('api-keys.json');
        const response = await fetch(keysUrl);
        
        // If file exists, do nothing
        if (response.ok) {
          return;
        }
        
        console.warn('No api-keys.json file found. You should create one with your API keys.');
        console.info('Expected format: { "openai": "your-key", "anthropic": "your-key", ... }');
        
        // Try to load from storage as fallback
        const loaded = await this.loadKeysFromStorage();
        
        if (!loaded) {
          // Show a notification to the user
          chrome.runtime.sendMessage({
            action: "showNotification",
            title: "API Keys Missing",
            message: "Please create an api-keys.json file with your API keys."
          });
        }
      } catch (error) {
        console.error('Error checking for api-keys.json:', error);
      }
    }
  };
  
  // Initialize: check for api-keys.json and try to load keys
  (async function() {
    try {
      await ApiKeysManager.loadApiKeys();
    } catch (error) {
      console.error('Error initializing ApiKeysManager:', error);
      // Try to load from storage as fallback
      await ApiKeysManager.loadKeysFromStorage();
    }
  })();