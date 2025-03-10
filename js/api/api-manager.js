/**
 * Aisolveall Assistant - API Manager
 * 
 * This module orchestrates API calls to different AI providers.
 */

const ApiManager = {
    /**
     * Send query to the selected AI provider
     * @param {string} provider - The provider name
     * @param {string} prompt - The prompt text
     * @param {string} model - The model name (optional)
     * @returns {Promise<string>} The response text
     */
    sendQueryToProvider: async function(provider, prompt, model) {
      // Validate inputs
      if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty");
      }
      
      // Route to the appropriate provider
      switch (provider) {
        case "openai":
          return OpenAIProvider.sendQuery(prompt, model);
          
        case "anthropic":
          return AnthropicProvider.sendQuery(prompt, model);
          
        case "gemini":
          return GeminiProvider.sendQuery(prompt, model);
          
        case "perplexity":
          return PerplexityProvider.sendQuery(prompt, model);
          
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    },
    
    /**
     * Get available models for a provider
     * @param {string} provider - The provider name
     * @returns {Array<Object>} Array of model objects
     */
    getModelsForProvider: function(provider) {
      switch (provider) {
        case "openai":
          return OpenAIProvider.getAvailableModels();
          
        case "anthropic":
          return AnthropicProvider.getAvailableModels();
          
        case "gemini":
          return GeminiProvider.getAvailableModels();
          
        case "perplexity":
          return PerplexityProvider.getAvailableModels();
          
        default:
          return [];
      }
    },
    
    /**
     * Get all available providers
     * @returns {Array<Object>} Array of provider objects
     */
    getAvailableProviders: function() {
      return [
        { id: "openai", name: "OpenAI (GPT)" },
        { id: "anthropic", name: "Anthropic (Claude)" },
        { id: "gemini", name: "Google (Gemini)" },
        { id: "perplexity", name: "Perplexity" }
      ];
    },
    
    /**
     * Check if a provider is available (has API key)
     * @param {string} provider - The provider name
     * @returns {Promise<boolean>} True if provider is available
     */
    isProviderAvailable: async function(provider) {
      const apiKey = await ApiKeysManager.getApiKey(provider);
      return !!apiKey && apiKey.trim() !== '';
    }
  };