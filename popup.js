document.addEventListener('DOMContentLoaded', function() {
  // UI elements
  const promptInput = document.getElementById('prompt');
  const sendButton = document.getElementById('send');
  const responseDiv = document.getElementById('response');
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const loadingSpinner = document.getElementById('loading');
  const toggleSidebarButton = document.getElementById('toggleSidebar');
  
  // Show/hide model selection based on provider
  providerSelect.addEventListener('change', function() {
    if (providerSelect.value === 'openai') {
      modelSelect.style.display = 'block';
    } else {
      modelSelect.style.display = 'none';
    }
  });
  
  // Toggle sidebar when button is clicked
  toggleSidebarButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSidebar"});
    });
  });
  
  // Send prompt when button is clicked
  sendButton.addEventListener('click', async function() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    const provider = providerSelect.value;
    const model = modelSelect.value;
    
    // Show loading spinner
    loadingSpinner.classList.remove('hidden');
    responseDiv.textContent = 'Loading...';
    
    try {
      // Load API key first using our api-keys-loader.js utility
      const apiKey = await getApiKey(provider);
      
      if (!apiKey) {
        throw new Error(`API key for ${provider} not found. Please check api-keys.json file.`);
      }
      
      let response;
      
      // Different handling for each provider
      if (provider === 'openai') {
        response = await sendToOpenAI(prompt, model, apiKey);
      } else if (provider === 'anthropic') {
        response = await sendToAnthropic(prompt, apiKey);
      } else if (provider === 'gemini') {
        response = await sendToGemini(prompt, apiKey);
      } else if (provider === 'perplexity') {
        response = await sendToPerplexity(prompt, apiKey);
      }
      
      // Display response
      responseDiv.textContent = response;
    } catch (error) {
      console.error('Error:', error);
      responseDiv.textContent = 'Error: ' + error.message;
    } finally {
      // Hide loading spinner
      loadingSpinner.classList.add('hidden');
    }
  });
  
  // OpenAI API call
  async function sendToOpenAI(prompt, model, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.statusText);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  // Anthropic API call (placeholder)
  async function sendToAnthropic(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok: ' + response.statusText);
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  // Gemini API call (placeholder)
  async function sendToGemini(prompt, apiKey) {
    // Implement actual Gemini API call
    return "Gemini API integration not fully implemented yet.";
  }
  
  // Perplexity API call (placeholder)
  async function sendToPerplexity(prompt, apiKey) {
    // Implement actual Perplexity API call
    return "Perplexity API integration not fully implemented yet.";
  }
});