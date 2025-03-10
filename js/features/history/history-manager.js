/**
 * Aisolveall Assistant - History Manager
 * 
 * This module handles chat history operations.
 */

const HistoryManager = {
    /**
     * Save chat history to global storage
     * @param {string} promptText - The prompt text
     * @param {string} responseText - The response text
     */
    saveChatHistory: function(promptText, responseText) {
      try {
        chrome.storage.local.get({ chatHistory: [] }, (result) => {
          const history = result.chatHistory;
          
          // Add new entry
          history.push({
            prompt: promptText,
            response: responseText,
            timestamp: new Date().toISOString(),
            provider: document.getElementById("providerSelect")?.value || "unknown",
            model: document.getElementById("modelSelect")?.value || "unknown"
          });
          
          // Limit history size to 100 entries
          if (history.length > 100) {
            history.shift(); // Remove oldest entry
          }
          
          chrome.storage.local.set({ chatHistory: history }, () => {
            console.log("Global chat history saved.");
          });
        });
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    },
    
    /**
     * Load and display chat history
     */
    loadChatHistory: function() {
      try {
        chrome.storage.local.get({ chatHistory: [] }, (result) => {
          const historyDiv = document.getElementById("chatHistory");
          
          if (!historyDiv) {
            console.error("History div not found");
            return;
          }
          
          historyDiv.innerHTML = "";
          
          if (result.chatHistory.length === 0) {
            historyDiv.textContent = "No chat history.";
            console.log("No global chat history found.");
            return;
          }
          
          // Display most recent first
          result.chatHistory.slice().reverse().forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "history-item";
            
            // Format timestamp
            const timestamp = new Date(item.timestamp);
            const formattedTime = timestamp.toLocaleString();
            
            // Create elements
            const timeElement = document.createElement("strong");
            timeElement.textContent = formattedTime;
            
            const providerElement = document.createElement("span");
            providerElement.textContent = ` [${item.provider}${item.model ? `/${item.model}` : ''}]`;
            providerElement.style.color = "#888";
            providerElement.style.fontSize = "0.9em";
            
            const promptLabel = document.createElement("div");
            promptLabel.innerHTML = "<em>Prompt:</em> ";
            promptLabel.style.marginTop = "5px";
            
            const promptText = document.createElement("span");
            promptText.textContent = item.prompt;
            
            const responseLabel = document.createElement("div");
            responseLabel.innerHTML = "<em>Response:</em> ";
            responseLabel.style.marginTop = "5px";
            
            const responseText = document.createElement("span");
            responseText.textContent = item.response;
            
            // Action buttons
            const actionDiv = document.createElement("div");
            actionDiv.className = "history-actions";
            actionDiv.style.marginTop = "5px";
            
            const copyBtn = document.createElement("button");
            copyBtn.textContent = "Copy";
            copyBtn.style.fontSize = "0.8em";
            copyBtn.style.padding = "2px 5px";
            copyBtn.style.marginRight = "5px";
            copyBtn.addEventListener("click", () => {
              UIHelper.copyToClipboard(item.response);
              copyBtn.textContent = "Copied!";
              setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
            });
            
            const useBtn = document.createElement("button");
            useBtn.textContent = "Use";
            useBtn.style.fontSize = "0.8em";
            useBtn.style.padding = "2px 5px";
            useBtn.addEventListener("click", () => {
              const promptArea = document.getElementById("aiPrompt");
              if (promptArea) {
                promptArea.value = item.prompt;
              }
            });
            
            actionDiv.appendChild(copyBtn);
            actionDiv.appendChild(useBtn);
            
            // Build the DOM structure
            itemDiv.appendChild(timeElement);
            itemDiv.appendChild(providerElement);
            
            promptLabel.appendChild(promptText);
            itemDiv.appendChild(promptLabel);
            
            responseLabel.appendChild(responseText);
            itemDiv.appendChild(responseLabel);
            
            itemDiv.appendChild(actionDiv);
            
            historyDiv.appendChild(itemDiv);
          });
          
          console.log("Global chat history loaded.");
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    },
    
    /**
     * Clear all chat history
     * @returns {Promise<boolean>} Success status
     */
    clearChatHistory: function() {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.set({ chatHistory: [] }, () => {
            console.log("Global chat history cleared.");
            resolve(true);
          });
        } catch (error) {
          console.error("Error clearing chat history:", error);
          reject(error);
        }
      });
    },
    
    /**
     * Export chat history as JSON
     * @returns {Promise<string>} JSON string
     */
    exportChatHistory: function() {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get({ chatHistory: [] }, (result) => {
            const jsonString = JSON.stringify(result.chatHistory, null, 2);
            resolve(jsonString);
          });
        } catch (error) {
          console.error("Error exporting chat history:", error);
          reject(error);
        }
      });
    },
    
    /**
     * Import chat history from JSON
     * @param {string} jsonString - JSON string
     * @returns {Promise<boolean>} Success status
     */
    importChatHistory: function(jsonString) {
      return new Promise((resolve, reject) => {
        try {
          const history = JSON.parse(jsonString);
          
          if (!Array.isArray(history)) {
            throw new Error("Invalid history format");
          }
          
          chrome.storage.local.set({ chatHistory: history }, () => {
            console.log("Global chat history imported.");
            resolve(true);
          });
        } catch (error) {
          console.error("Error importing chat history:", error);
          reject(error);
        }
      });
    },
    
    /**
     * Search chat history
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching history items
     */
    searchChatHistory: function(query) {
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get({ chatHistory: [] }, (result) => {
            const lowerQuery = query.toLowerCase();
            const matches = result.chatHistory.filter(item => 
              item.prompt.toLowerCase().includes(lowerQuery) || 
              item.response.toLowerCase().includes(lowerQuery)
            );
            
            resolve(matches);
          });
        } catch (error) {
          console.error("Error searching chat history:", error);
          reject(error);
        }
      });
    }
  };