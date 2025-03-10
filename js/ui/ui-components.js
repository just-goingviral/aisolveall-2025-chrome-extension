/**
 * Aisolveall Assistant - UI Components
 * 
 * This module contains functions to create UI components.
 */

const UIComponents = {
    /**
     * Create the floating button for toggling the sidebar
     */
    createFloatingButton: function() {
      const chatButton = UIHelper.createElement('button', {
        id: 'aisolveall-chat-button',
        text: 'Aisolveall Chat',
        attributes: {
          'aria-label': 'Toggle Chat Sidebar',
          'tabindex': '0'
        }
      }, {
        click: () => {
          console.log("Chat button clicked.");
          AisolveallApp.toggleSidebar();
        }
      });
      
      document.body.appendChild(chatButton);
      console.log("Floating chat button created");
    },
    
    /**
     * Create the sidebar UI
     * @returns {HTMLElement} The created sidebar element
     */
    createSidebar: function() {
      try {
        // Main container for the sidebar
        const sidebarEl = UIHelper.createElement('div', {
          id: 'aisolveall-sidebar'
        });
        
        document.body.appendChild(sidebarEl);
        
        // Create sidebar sections
        this.createHeaderSection(sidebarEl);
        sidebarEl.appendChild(document.createElement("hr"));
        this.createProviderSection(sidebarEl);
        this.createProjectSection(sidebarEl);
        this.createPresetPromptSection(sidebarEl);
        this.createVoiceSection(sidebarEl);
        this.createPromptSection(sidebarEl);
        this.createButtonRow(sidebarEl);
        this.createSendButton(sidebarEl);
        this.createResponseSection(sidebarEl);
        this.createHistorySection(sidebarEl);
        
        console.log("Sidebar created successfully");
        
        // Add event listeners
        EventHandlers.setupSidebarEventListeners();
        
        return sidebarEl;
      } catch (error) {
        console.error("Error creating sidebar:", error);
        UIHelper.showError("Error creating sidebar: " + error.message);
        return null;
      }
    },
    
    /**
     * Create header section with title and close button
     * @param {HTMLElement} parent - Parent element
     */
    createHeaderSection: function(parent) {
      const header = UIHelper.createElement('div', {
        className: 'sidebar-header'
      });
      
      const title = UIHelper.createElement('h3', {
        text: 'Aisolveall Assistant',
        style: {
          margin: '0'
        }
      });
      
      const closeBtn = UIHelper.createElement('button', {
        text: 'X',
        className: 'danger-button',
        attributes: {
          'aria-label': 'Close Chat Sidebar',
          'tabindex': '0'
        }
      }, {
        click: () => {
          console.log("Close button clicked.");
          AisolveallApp.toggleSidebar();
        }
      });
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      parent.appendChild(header);
      
      // Dark Mode Toggle
      const darkModeToggle = UIHelper.createElement('button', {
        text: 'Toggle Dark Mode',
        className: 'full-width-button secondary-button',
        attributes: {
          'tabindex': '0'
        }
      }, {
        click: () => {
          parent.classList.toggle("dark-mode");
          console.log("Dark mode toggled. Now:", parent.classList.contains("dark-mode") ? "ON" : "OFF");
        }
      });
      
      parent.appendChild(darkModeToggle);
    },
    
    /**
     * Create provider selection section
     * @param {HTMLElement} parent - Parent element
     */
    createProviderSection: function(parent) {
      const providerSection = UIHelper.createElement('div', {
        className: 'provider-section'
      });
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'AI Provider'
      });
      providerSection.appendChild(sectionTitle);
      
      const providerLabel = UIHelper.createElement('label', {
        text: 'Select Provider:',
        attributes: {
          'for': 'providerSelect'
        }
      });
      
      const providerSelect = UIHelper.createElement('select', {
        id: 'providerSelect',
        attributes: {
          'tabindex': '0'
        }
      });
      
      // Get available providers from ApiManager
      const providers = ApiManager.getAvailableProviders();
      
      providers.forEach(p => {
        const opt = UIHelper.createElement('option', {
          text: p.name,
          attributes: {
            'value': p.id
          }
        });
        providerSelect.appendChild(opt);
      });
      
      // Model selection dropdown
      const modelSelect = UIHelper.createElement('select', {
        id: 'modelSelect',
        attributes: {
          'tabindex': '0'
        }
      });
      
      // Populate with models for the default selected provider
      this.populateModelSelect(modelSelect, providerSelect.value);
      
      // Show/hide and update modelSelect when provider changes
      providerSelect.addEventListener("change", () => {
        this.handleProviderChange(providerSelect, modelSelect);
      });
      
      providerSection.appendChild(providerLabel);
      providerSection.appendChild(providerSelect);
      providerSection.appendChild(modelSelect);
      parent.appendChild(providerSection);
      
      // Initialize model display state
      this.handleProviderChange(providerSelect, modelSelect);
    },
    
    /**
     * Handle provider change
     * @param {HTMLSelectElement} providerSelect - Provider select element
     * @param {HTMLSelectElement} modelSelect - Model select element
     */
    handleProviderChange: function(providerSelect, modelSelect) {
      const selectedProvider = providerSelect.value;
      
      // Only show model selection for providers with multiple models
      if (selectedProvider === 'openai' || selectedProvider === 'anthropic') {
        modelSelect.style.display = "block";
        // Update models list
        this.populateModelSelect(modelSelect, selectedProvider);
      } else {
        modelSelect.style.display = "none";
      }
    },
    
    /**
     * Populate model select dropdown
     * @param {HTMLSelectElement} modelSelect - Model select element
     * @param {string} provider - Provider ID
     */
    populateModelSelect: function(modelSelect, provider) {
      // Clear existing options
      modelSelect.innerHTML = "";
      
      // Get models for the provider
      const models = ApiManager.getModelsForProvider(provider);
      
      // Add options
      models.forEach(model => {
        const option = UIHelper.createElement('option', {
          text: model.name,
          attributes: {
            'value': model.id
          }
        });
        
        modelSelect.appendChild(option);
      });
      
      // Select first option
      if (models.length > 0) {
        modelSelect.value = models[0].id;
      }
    },
    
    /**
     * Create project management section
     * @param {HTMLElement} parent - Parent element
     */
    createProjectSection: function(parent) {
      const projectSection = UIHelper.createElement('div', {
        className: 'project-section'
      });
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'Project'
      });
      projectSection.appendChild(sectionTitle);
      
      const projectLabel = UIHelper.createElement('label', {
        text: 'Select Project:',
        attributes: {
          'for': 'projectSelect'
        }
      });
      
      const projectSelect = UIHelper.createElement('select', {
        id: 'projectSelect',
        attributes: {
          'tabindex': '0'
        }
      });
      
      // Button to create a new project
      const createProjectBtn = UIHelper.createElement('button', {
        text: 'Create New Project',
        className: 'full-width-button secondary-button',
        attributes: {
          'tabindex': '0'
        }
      });
      
      projectSection.appendChild(projectLabel);
      projectSection.appendChild(projectSelect);
      projectSection.appendChild(createProjectBtn);
      parent.appendChild(projectSection);
      
      // Load existing projects
      ProjectManager.loadProjects();
    },
    
    /**
     * Create preset prompt section
     * @param {HTMLElement} parent - Parent element
     */
    createPresetPromptSection: function(parent) {
      const presetSection = UIHelper.createElement('div');
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'Preset Prompts'
      });
      presetSection.appendChild(sectionTitle);
      
      const presetLabel = UIHelper.createElement('label', {
        text: 'Select Prompt:',
        attributes: {
          'for': 'presetPrompts'
        }
      });
      
      const presetSelect = UIHelper.createElement('select', {
        id: 'presetPrompts',
        attributes: {
          'tabindex': '0'
        }
      });
      
      const presets = [
        { value: "", label: "-- Select a prompt --" },
        { value: "Summarize this email:", label: "Summarize this email" },
        { value: "Generate a reply:", label: "Generate a reply" },
        { value: "Fix grammar:", label: "Fix grammar" },
        { value: "Translate to Spanish:", label: "Translate to Spanish" },
        { value: "Translate to French:", label: "Translate to French" },
        { value: "Rewrite the following text:", label: "Rewrite selected text" }
      ];
      
      presets.forEach(p => {
        const opt = UIHelper.createElement('option', {
          text: p.label,
          attributes: {
            'value': p.value
          }
        });
        presetSelect.appendChild(opt);
      });
      
      presetSection.appendChild(presetLabel);
      presetSection.appendChild(presetSelect);
      parent.appendChild(presetSection);
    },
    
    /**
     * Create voice section for ElevenLabs integration
     * @param {HTMLElement} parent - Parent element
     */
    createVoiceSection: function(parent) {
      const voiceSection = UIHelper.createElement('div');
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'Voice Options'
      });
      voiceSection.appendChild(sectionTitle);
      
      const voiceLabel = UIHelper.createElement('label', {
        text: 'Select Voice:',
        attributes: {
          'for': 'voiceSelect'
        }
      });
      
      const voiceSelect = UIHelper.createElement('select', {
        id: 'voiceSelect',
        attributes: {
          'tabindex': '0'
        }
      });
      
      // Voice parameter inputs container
      const paramContainer = UIHelper.createElement('div', {
        className: 'voice-parameters'
      });
      
      // Voice parameter controls (for ElevenLabs TTS)
      const stabilityInput = UIHelper.createElement('input', {
        attributes: {
          'type': 'number',
          'min': '0',
          'max': '1',
          'step': '0.01',
          'value': '0.75',
          'placeholder': 'Stability (0-1)',
          'tabindex': '0'
        }
      });
      
      const similarityInput = UIHelper.createElement('input', {
        attributes: {
          'type': 'number',
          'min': '0',
          'max': '1',
          'step': '0.01',
          'value': '0.75',
          'placeholder': 'Similarity Boost (0-1)',
          'tabindex': '0'
        }
      });
      
      paramContainer.appendChild(stabilityInput);
      paramContainer.appendChild(similarityInput);
      
      // Voice control buttons container
      const btnContainer = UIHelper.createElement('div', {
        className: 'voice-controls'
      });
      
      // Buttons for ElevenLabs TTS actions
      const playVoiceBtn = UIHelper.createElement('button', {
        id: 'playVoice',
        text: 'Play Voice',
        className: 'action-button',
        attributes: {
          'tabindex': '0'
        }
      });
      
      const stopVoiceBtn = UIHelper.createElement('button', {
        id: 'stopVoice',
        text: 'Stop Voice',
        className: 'warning-button',
        attributes: {
          'tabindex': '0'
        }
      });
      
      const cloneVoiceBtn = UIHelper.createElement('button', {
        id: 'cloneVoice',
        text: 'Clone Voice',
        className: 'secondary-button',
        attributes: {
          'tabindex': '0'
        }
      });
      
      btnContainer.appendChild(playVoiceBtn);
      btnContainer.appendChild(stopVoiceBtn);
      btnContainer.appendChild(cloneVoiceBtn);
      
      // Loading spinner for TTS requests
      const ttsSpinner = UIHelper.createElement('span', {
        id: 'ttsSpinner',
        text: '⏳',
        style: {
          display: 'none'
        }
      });
      
      voiceSection.appendChild(voiceLabel);
      voiceSection.appendChild(voiceSelect);
      voiceSection.appendChild(paramContainer);
      voiceSection.appendChild(btnContainer);
      voiceSection.appendChild(ttsSpinner);
      
      parent.appendChild(voiceSection);
      
      // Initialize ElevenLabs voice dropdown
      VoiceManager.fetchElevenLabsVoices(voiceSelect);
    },
    
    /**
     * Create prompt textarea section
     * @param {HTMLElement} parent - Parent element
     */
    createPromptSection: function(parent) {
      const promptSection = UIHelper.createElement('div');
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'Your Prompt'
      });
      promptSection.appendChild(sectionTitle);
      
      const promptArea = UIHelper.createElement('textarea', {
        id: 'aiPrompt',
        attributes: {
          'placeholder': 'Enter your prompt here...',
          'rows': '4',
          'tabindex': '0'
        }
      });
      
      promptSection.appendChild(promptArea);
      parent.appendChild(promptSection);
    },
    
    /**
     * Create button row with special actions
     * @param {HTMLElement} parent - Parent element
     */
    createButtonRow: function(parent) {
      const btnRow = UIHelper.createElement('div', {
        className: 'button-row'
      });
      
      const voiceInputBtn = UIHelper.createElement('button', {
        id: 'voiceInput',
        text: '🎤',
        attributes: {
          'title': 'Voice Input',
          'aria-label': 'Activate Voice Input',
          'tabindex': '0'
        },
        style: {
          flex: '1'
        }
      });
      
      const useSelBtn = UIHelper.createElement('button', {
        id: 'useSelected',
        text: 'Use Selected Text',
        style: {
          flex: '2'
        },
        attributes: {
          'tabindex': '0'
        }
      });
      
      btnRow.appendChild(voiceInputBtn);
      btnRow.appendChild(useSelBtn);
      
      // Add email-specific button if on Gmail
      if (window.location.href.includes("mail.google.com")) {
        const emailReplyBtn = UIHelper.createElement('button', {
          id: 'emailReply',
          text: 'Generate Email Reply',
          style: {
            flex: '2'
          },
          attributes: {
            'tabindex': '0'
          }
        });
        
        btnRow.appendChild(emailReplyBtn);
      }
      
      // Add Google Docs-specific button if on Google Docs
      if (window.location.href.includes("docs.google.com")) {
        const applyInlineBtn = UIHelper.createElement('button', {
          id: 'applyInline',
          text: 'Apply Inline',
          style: {
            flex: '2'
          },
          attributes: {
            'tabindex': '0'
          }
        });
        
        btnRow.appendChild(applyInlineBtn);
      }
      
      parent.appendChild(btnRow);
    },
    
    /**
     * Create send button
     * @param {HTMLElement} parent - Parent element
     */
    createSendButton: function(parent) {
      const sendBtn = UIHelper.createElement('button', {
        id: 'sendPrompt',
        text: 'Send',
        className: 'full-width-button action-button',
        attributes: {
          'tabindex': '0'
        }
      });
      
      parent.appendChild(sendBtn);
    },
    
    /**
     * Create response display section
     * @param {HTMLElement} parent - Parent element
     */
    createResponseSection: function(parent) {
      const responseSection = UIHelper.createElement('div');
      
      const sectionTitle = UIHelper.createElement('div', {
        className: 'section-header',
        text: 'Response'
      });
      responseSection.appendChild(sectionTitle);
      
      const responseDiv = UIHelper.createElement('div', {
        id: 'aiResponse'
      });
      
      responseSection.appendChild(responseDiv);
      parent.appendChild(responseSection);
    },
    
    /**
     * Create chat history section
     * @param {HTMLElement} parent - Parent element
     */
    createHistorySection: function(parent) {
      const historySection = UIHelper.createElement('div');
      
      const historyToggleBtn = UIHelper.createElement('button', {
        id: 'toggleHistory',
        text: 'Chat History',
        className: 'full-width-button secondary-button',
        style: {
          marginTop: '10px'
        },
        attributes: {
          'tabindex': '0'
        }
      });
      
      const historyDiv = UIHelper.createElement('div', {
        id: 'chatHistory',
        style: {
          display: 'none'
        }
      });
      
      historySection.appendChild(historyToggleBtn);
      historySection.appendChild(historyDiv);
      parent.appendChild(historySection);
    }
  };