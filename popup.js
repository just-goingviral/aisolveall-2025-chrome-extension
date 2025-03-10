/**
 * Aisolveall Assistant - Popup Script
 * 
 * Handles the functionality of the extension popup.
 */

document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const promptInput = document.getElementById('prompt');
  const sendButton = document.getElementById('send');
  const responseDiv = document.getElementById('response');
  const loadingSpinner = document.getElementById('loading');
  const toggleSidebarButton = document.getElementById('toggleSidebar');
  const settingsButton = document.getElementById('settings');
  const viewHistoryButton = document.getElementById('viewHistory');
  const apiStatusSpan = document.getElementById('apiStatus');
  
  // Initialize provider and model selection
  initializeProviderSelection();
  
  // Check API keys status
  checkApiKeysStatus();
  
  // Event listeners
  providerSelect.addEventListener('change', handleProviderChange);
  sendButton.addEventListener('click', handleSendClick);
  toggleSidebarButton.addEventListener('click', handleToggleSidebar);
  settingsButton.addEventListener('click', handleSettingsClick);
  viewHistoryButton.addEventListener('click', handleHistoryClick);
  
  /**
   * Initialize provider and model selection
   */
  function initializeProviderSelection() {
    // Initially show/hide model selection based on selected provider
    handleProviderChange();
    
    // Load any saved preferences
    chrome.storage.local.get(['preferredProvider', 'preferredModel'], (result) => {
      if (result.preferredProvider) {
        providerSelect.value = result.preferredProvider;
      }
      
      if (result.preferredModel) {
        modelSelect.value = result.preferredModel;
      }
      
      // Update UI based on loaded preferences
      handleProviderChange();
    });
  }
  
  /**
   * Handle provider selection change
   */
  function handleProviderChange() {
    const selectedProvider = providerSelect.value;
    
    // Show/hide model selection based on provider
    if (selectedProvider === 'openai') {
      modelSelect.style.display = 'block';
    } else {
      modelSelect.style.display = 'none';
    }
    
    // Save preference
    chrome.storage.local.set({
      preferredProvider: selectedProvider,
      preferredModel: modelSelect.value
    });
  }
  
  /**
   * Handle send button click
   */
  async function handleSendClick() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt.');
      return;
    }
    
    // Show loading state
    sendButton.disabled = true;
    loadingSpinner.classList.remove('hidden');
    responseDiv.textContent = 'Thinking...';
    responseDiv.classList.remove('hidden');
    
    try {
      const provider = providerSelect.value;
      const model = provider === 'openai' ? modelSelect.value : null;
      
      // Get the active tab
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const activeTab = tabs[0];
      
      // Send message to content script to make API call
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'makeApiCall',
        provider: provider,
        model: model,
        prompt: prompt
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded
          handleApiCallDirectly(provider, model, prompt);
          return;
        }
        
        if (response && response.success) {
          responseDiv.textContent = response.data;
        } else {
          responseDiv.textContent = response.error || 'Error: No response received.';
        }
        
        // Reset UI state
        sendButton.disabled = false;
        loadingSpinner.classList.add('hidden');
      });
    } catch (error) {
      responseDiv.textContent = `Error: ${error.message}`;
      sendButton.disabled = false;
      loadingSpinner.classList.add('hidden');
    }
  }
  
  /**
   * Make API call directly from popup if content script isn't available
   */
  async function handleApiCallDirectly(provider, model, prompt) {
    try {
      // This is a fallback when content script isn't loaded
      // It's a simplified version that works for basic functionality
      
      let response;
      
      if (provider === 'openai') {
        const apiKey = await getApiKey('openai');
        
        if (!apiKey) {
          throw new Error('OpenAI API key not found');
        }
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
          })
        });
        
        const data = await openaiResponse.json();
        
        if (data.choices && data.choices.length > 0) {
          response = data.choices[0].message.content.trim();
        } else {
          throw new Error('No response from OpenAI');
        }
      } else {
        response = `The ${provider} provider is not available in popup-only mode. Please open the full assistant.`;
      }
      
      responseDiv.textContent = response;
    } catch (error) {
      responseDiv.textContent = `Error: ${error.message}`;
    } finally {
      sendButton.disabled = false;
      loadingSpinner.classList.add('hidden');
    }
  }
  
  /**
   * Get API key (simplified version for popup)
   */
  async function getApiKey(provider) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKeys'], (result) => {
        if (result.apiKeys && result.apiKeys[provider]) {
          resolve(result.apiKeys[provider]);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  /**
   * Handle toggle sidebar button click
   */
  function handleToggleSidebar() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleSidebar'});
      window.close(); // Close the popup
    });
  }
  
  /**
   * Handle settings button click
   */
  function handleSettingsClick() {
    // For now, just show a message
    alert('Settings functionality will be implemented in a future version.');
  }
  
  /**
   * Handle history button click
   */
  function handleHistoryClick() {
    // For now, just show a message
    alert('History functionality will be implemented in a future version.');
  }
  
  /**
   * Check API keys status
   */
  async function checkApiKeysStatus() {
    try {
      // If ApiKeysManager is available (included in popup.html), use it
      if (typeof ApiKeysManager !== 'undefined') {
        const keysValid = await ApiKeysManager.verifyApiKeys();
        apiStatusSpan.textContent = keysValid ? 
          'API Keys: ✓ Valid' : 
          'API Keys: ✗ Missing or Invalid';
        apiStatusSpan.style.color = keysValid ? '#5cb85c' : '#d9534f';
      } else {
        // Fallback method
        chrome.storage.local.get(['apiKeys'], (result) => {
          const hasKeys = result.apiKeys && Object.keys(result.apiKeys).some(k => 
            result.apiKeys[k] && result.apiKeys[k].trim() !== ''
          );
          
          apiStatusSpan.textContent = hasKeys ? 
            'API Keys: ✓ Found' : 
            'API Keys: ✗ Missing';
          apiStatusSpan.style.color = hasKeys ? '#5cb85c' : '#d9534f';
        });
      }
    } catch (error) {
      apiStatusSpan.textContent = 'API Keys: ✗ Error checking';
      apiStatusSpan.style.color = '#d9534f';
    }
  }
});