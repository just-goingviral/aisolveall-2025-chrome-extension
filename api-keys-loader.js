/**
 * Aisolveall Assistant - API Keys Loader
 * 
 * This file loads API keys from the api-keys.json file and makes them
 * available throughout the project. It's a more secure approach than
 * hardcoding API keys directly in the code.
 */

let API_KEYS = {}; 

/**
 * Loads API keys from the JSON file
 * @returns {Promise} A promise that resolves when API keys are loaded
 */
async function loadApiKeys() {
  try {
    const response = await fetch(chrome.runtime.getURL('api-keys.json'));
    if (!response.ok) {
      throw new Error(`Failed to load API keys: ${response.status} ${response.statusText}`);
    }
    
    API_KEYS = await response.json();
    console.log('API keys loaded successfully');
    return API_KEYS;
  } catch (error) {
    console.error('Error loading API keys:', error);
    // Provide fallback keys or handle the error as needed
    return {};
  }
}

/**
 * Gets a specific API key by provider name
 * @param {string} provider - The name of the API provider
 * @returns {string|null} The API key or null if not found
 */
function getApiKey(provider) {
  return API_KEYS[provider] || null;
}

// Immediately load API keys when this script is executed
loadApiKeys();