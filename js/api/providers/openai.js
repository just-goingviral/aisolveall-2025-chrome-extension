/**
 * Aisolveall Assistant - OpenAI Provider Module
 * 
 * Handles API calls to OpenAI services.
 */

const OpenAIProvider = {
    /**
     * The base URL for OpenAI API
     */
    BASE_URL: 'https://api.openai.com/v1',
    
    /**
     * Available models with their capabilities
     */
    MODELS: {
      'gpt-3.5-turbo': {
        description: 'GPT-3.5 Turbo - Fast and cost-effective',
        maxTokens: 4096
      },
      'gpt-4': {
        description: 'GPT-4 - Most capable model',
        maxTokens: 8192
      }
    },
    
    /**
     * Send query to OpenAI API
     * @param {string} prompt - The prompt text
     * @param {string} model - The model name (defaults to gpt-3.5-turbo)
     * @returns {Promise<string>} The response text
     */
    sendQuery: async function(prompt, model = 'gpt-3.5-turbo') {
      // Get API key
      const openaiKey = await ApiKeysManager.getApiKey('openai');
      
      if (!openaiKey) {
        throw new Error("OpenAI API key not found. Please add your key in api-keys.json");
      }
      
      const endpoint = `${this.BASE_URL}/chat/completions`;
      const messages = [{ role: "user", content: prompt }];
      
      try {
        console.log(`Sending request to OpenAI (${model})...`);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: this.getMaxResponseTokens(model),
            temperature: 0.7
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content.trim();
        } else {
          return "No response received from OpenAI.";
        }
      } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw error;
      }
    },
    
    /**
     * Get the list of available models
     * @returns {Array<Object>} Array of model objects with id and name
     */
    getAvailableModels: function() {
      return Object.keys(this.MODELS).map(id => ({
        id: id,
        name: id.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ')
      }));
    },
    
    /**
     * Get maximum response tokens for a model
     * @param {string} model - The model name
     * @returns {number} Maximum tokens for response
     */
    getMaxResponseTokens: function(model) {
      // Default to 500 tokens if model not found
      return (this.MODELS[model]?.maxTokens / 2) || 500;
    }
  };