/**
 * Aisolveall Assistant - Perplexity Provider Module
 * 
 * Handles API calls to Perplexity services.
 */

const PerplexityProvider = {
    /**
     * The base URL for Perplexity API
     */
    BASE_URL: 'https://api.perplexity.ai',
    
    /**
     * Available models with their capabilities
     */
    MODELS: {
      'sonar-small-online': {
        description: 'Sonar Small - Fast model with online search',
        maxTokens: 4096
      },
      'sonar-medium-online': {
        description: 'Sonar Medium - Balanced model with online search',
        maxTokens: 4096
      }
    },
    
    /**
     * Send query to Perplexity API
     * @param {string} prompt - The prompt text
     * @param {string} model - The model name (defaults to sonar-small-online)
     * @returns {Promise<string>} The response text
     */
    sendQuery: async function(prompt, model = 'sonar-small-online') {
      // Get API key
      const perplexityKey = await ApiKeysManager.getApiKey('perplexity');
      
      if (!perplexityKey) {
        throw new Error("Perplexity API key not found. Please add your key in api-keys.json");
      }
      
      try {
        console.log(`Perplexity integration for ${model} would be called here`);
        console.log(`This requires backend support for proper implementation`);
        
        // This is a placeholder for future implementation
        // In a real implementation, we would make an API call to Perplexity
        
        // Note that a proper implementation would call:
        // const endpoint = `${this.BASE_URL}/chat/completions`;
        // And use the proper headers and body structure for Perplexity's API
        
        return "Perplexity integration not fully implemented yet. Add your Perplexity API key and implement server-side proxy for production use.";
      } catch (error) {
        console.error("Error calling Perplexity API:", error);
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
    }
  };