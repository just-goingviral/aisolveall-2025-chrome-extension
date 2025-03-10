/**
 * Aisolveall Assistant - Event Handlers
 * 
 * This module contains all the event handlers for the UI.
 */

const EventHandlers = {
    /**
     * Set up all event listeners for the sidebar
     */
    setupSidebarEventListeners: function() {
      // Send button
      const sendBtn = document.getElementById("sendPrompt");
      if (sendBtn) {
        sendBtn.addEventListener("click", this.handleSendButtonClick);
      }
      
      // Voice input button
      const voiceInputBtn = document.getElementById("voiceInput");
      if (voiceInputBtn) {
        voiceInputBtn.addEventListener("click", this.handleVoiceInputClick);
      }
      
      // Use selected text button
      const useSelBtn = document.getElementById("useSelected");
      if (useSelBtn) {
        useSelBtn.addEventListener("click", this.handleUseSelectedTextClick);
      }
      
      // Play voice button
      const playVoiceBtn = document.getElementById("playVoice");
      if (playVoiceBtn) {
        playVoiceBtn.addEventListener("click", this.handlePlayVoiceClick);
      }
      
      // Stop voice button
      const stopVoiceBtn = document.getElementById("stopVoice");
      if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener("click", this.handleStopVoiceClick);
      }
      
      // Clone voice button
      const cloneVoiceBtn = document.getElementById("cloneVoice");
      if (cloneVoiceBtn) {
        cloneVoiceBtn.addEventListener("click", () => {
          console.log("Clone Voice button clicked.");
          alert("Voice cloning functionality is not implemented in this demo.");
        });
      }
      
      // History toggle button
      const historyToggleBtn = document.getElementById("toggleHistory");
      if (historyToggleBtn) {
        historyToggleBtn.addEventListener("click", this.handleHistoryToggleClick);
      }
      
      // Preset prompts dropdown
      const presetSelect = document.getElementById("presetPrompts");
      if (presetSelect) {
        presetSelect.addEventListener("change", this.handlePresetSelectChange);
      }
      
      // Project select dropdown
      const projectSelect = document.getElementById("projectSelect");
      if (projectSelect) {
        projectSelect.addEventListener("change", this.handleProjectSelectChange);
      }
      
      // Create project button
      const createProjectBtn = document.querySelector(".project-section .secondary-button");
      if (createProjectBtn) {
        createProjectBtn.addEventListener("click", this.handleCreateProjectClick);
      }
      
      // Email reply button (if on Gmail)
      const emailReplyBtn = document.getElementById("emailReply");
      if (emailReplyBtn) {
        emailReplyBtn.addEventListener("click", this.handleEmailReplyClick);
      }
      
      // Apply inline button (if on Google Docs)
      const applyInlineBtn = document.getElementById("applyInline");
      if (applyInlineBtn) {
        applyInlineBtn.addEventListener("click", this.handleApplyInlineClick);
      }
    },
    
    /**
     * Handle send button click
     */
    handleSendButtonClick: async function() {
      try {
        const promptArea = document.getElementById("aiPrompt");
        const responseDiv = document.getElementById("aiResponse");
        
        if (!promptArea || !responseDiv) {
          console.error("Prompt area or response div not found");
          return;
        }
        
        let promptText = promptArea.value.trim();
        
        if (!promptText) {
          alert("Please enter a prompt.");
          return;
        }
        
        // If an active project is selected, prepend its context
        if (AisolveallApp.state.activeProject) {
          const projectContext = await ProjectManager.getProjectContext(AisolveallApp.state.activeProject);
          if (projectContext) {
            promptText = projectContext + "\n\n" + promptText;
          }
        }
        
        console.log("Sending prompt:", promptText);
        responseDiv.textContent = "Loading...";
        
        // Determine the selected provider and model (if applicable)
        const providerSelect = document.getElementById("providerSelect");
        const modelSelect = document.getElementById("modelSelect");
        
        if (!providerSelect) {
          console.error("Provider select not found");
          return;
        }
        
        const provider = providerSelect.value;
        let model = null;
        
        if (provider === "openai" && modelSelect) {
          model = modelSelect.value;
        }
        
        // Send the prompt using the selected provider
        try {
          const reply = await ApiManager.sendQueryToProvider(provider, promptText, model);
          
          responseDiv.textContent = reply;
          console.log("Received response:", reply);
          
          // Save to chat history
          HistoryManager.saveChatHistory(promptArea.value.trim(), reply);
          
          // If a project is active, append to project history
          if (AisolveallApp.state.activeProject) {
            ProjectManager.appendProjectHistory(AisolveallApp.state.activeProject, promptArea.value.trim(), reply);
          }
        } catch (error) {
          console.error("Error getting AI response:", error);
          responseDiv.textContent = "Error: " + error.message;
        }
      } catch (error) {
        console.error("Error sending prompt:", error);
        const responseDiv = document.getElementById("aiResponse");
        if (responseDiv) {
          responseDiv.textContent = "Error: " + error.message;
        }
      }
    },
    
    /**
     * Handle voice input button click
     */
    handleVoiceInputClick: function() {
      try {
        console.log("Voice input button clicked.");
        
        const promptArea = document.getElementById("aiPrompt");
        if (!promptArea) {
          console.error("Prompt area not found");
          return;
        }
        
        // Get voice input button for visual feedback
        const voiceInputBtn = document.getElementById("voiceInput");
        
        // Create visual feedback for recording
        const startRecording = () => {
          if (voiceInputBtn) {
            voiceInputBtn.textContent = "🔴"; // Red circle to indicate recording
            voiceInputBtn.style.backgroundColor = "#d9534f";
          }
        };
        
        // Reset button appearance
        const stopRecording = () => {
          if (voiceInputBtn) {
            voiceInputBtn.textContent = "🎤";
            voiceInputBtn.style.backgroundColor = "";
          }
        };
        
        // Initialize speech recognition
        const recognition = VoiceManager.initSpeechRecognition(
          promptArea, 
          startRecording, 
          stopRecording
        );
        
        if (recognition) {
          recognition.start();
        } else {
          alert("Voice recognition not supported in this browser.");
        }
      } catch (error) {
        console.error("Error initializing voice input:", error);
      }
    },
    
    /**
     * Handle use selected text button click
     */
    handleUseSelectedTextClick: function() {
      try {
        const selectedText = window.getSelection().toString();
        
        if (selectedText) {
          const promptArea = document.getElementById("aiPrompt");
          if (promptArea) {
            promptArea.value = selectedText;
            console.log("Using selected text for prompt.");
          }
        } else {
          alert("No text selected.");
        }
      } catch (error) {
        console.error("Error using selected text:", error);
      }
    },
    
    /**
     * Handle play voice button click
     */
    handlePlayVoiceClick: async function() {
      try {
        console.log("Play Voice button clicked.");
        
        const responseDiv = document.getElementById("aiResponse");
        const ttsSpinner = document.getElementById("ttsSpinner");
        const voiceSelect = document.getElementById("voiceSelect");
        
        if (!responseDiv || !ttsSpinner || !voiceSelect) {
          console.error("Required elements not found");
          return;
        }
        
        const responseText = responseDiv.textContent;
        
        if (!responseText) {
          alert("No response available to play.");
          return;
        }
        
        ttsSpinner.style.display = "inline";
        
        const sanitizedText = UIHelper.sanitizeTextForVoice(responseText);
        const selectedVoiceId = voiceSelect.value;
        
        if (!selectedVoiceId) {
          alert("Please select a voice from the dropdown.");
          ttsSpinner.style.display = "none";
          return;
        }
        
        await VoiceManager.playTextAsVoice(sanitizedText, selectedVoiceId);
        
        ttsSpinner.style.display = "none";
      } catch (err) {
        console.error("Error playing voice:", err);
        const ttsSpinner = document.getElementById("ttsSpinner");
        if (ttsSpinner) {
          ttsSpinner.style.display = "none";
        }
        alert("Error playing voice: " + err.message);
      }
    },
    
    /**
     * Handle stop voice button click
     */
    handleStopVoiceClick: function() {
      try {
        console.log("Stop Voice button clicked.");
        VoiceManager.stopCurrentAudio();
      } catch (error) {
        console.error("Error stopping audio:", error);
        alert("Error stopping audio: " + error.message);
      }
    },
    
    /**
     * Handle history toggle button click
     */
    handleHistoryToggleClick: function() {
      try {
        const historyDiv = document.getElementById("chatHistory");
        
        if (!historyDiv) {
          console.error("History div not found");
          return;
        }
        
        if (historyDiv.style.display === "none") {
          HistoryManager.loadChatHistory();
          historyDiv.style.display = "block";
          console.log("Chat history displayed.");
        } else {
          historyDiv.style.display = "none";
          console.log("Chat history hidden.");
        }
      } catch (error) {
        console.error("Error toggling chat history:", error);
      }
    },
    
    /**
     * Handle preset select change
     */
    handlePresetSelectChange: function() {
      const presetSelect = document.getElementById("presetPrompts");
      const promptArea = document.getElementById("aiPrompt");
      
      if (promptArea && presetSelect && presetSelect.value) {
        promptArea.value = presetSelect.value + "\n\n";
        console.log("Preset prompt selected:", presetSelect.value);
      }
    },
    
    /**
     * Handle project select change
     */
    handleProjectSelectChange: function() {
      const projectSelect = document.getElementById("projectSelect");
      
      if (projectSelect) {
        AisolveallApp.state.activeProject = projectSelect.value;
        console.log("Active project changed to:", AisolveallApp.state.activeProject);
      }
    },
    
    /**
     * Handle create project button click
     */
    handleCreateProjectClick: function() {
      const projectName = prompt("Enter a new project name:");
      if (projectName) {
        ProjectManager.createNewProject(projectName);
      }
    },
    
    /**
     * Handle email reply button click (if on Gmail)
     */
    handleEmailReplyClick: function() {
      try {
        console.log("Generate Email Reply button clicked.");
        const composeBox = document.querySelector('div[aria-label="Message Body"], div[role="textbox"]');
        const emailText = composeBox ? composeBox.innerText : "";
        const promptArea = document.getElementById("aiPrompt");
        
        if (promptArea) {
          promptArea.value = "Generate a reply for this email:\n\n" + emailText;
        }
      } catch (error) {
        console.error("Error generating email reply:", error);
        alert("Error generating email reply: " + error.message);
      }
    },
    
    /**
     * Handle apply inline button click (if on Google Docs)
     */
    handleApplyInlineClick: function() {
      try {
        console.log("Apply Inline button clicked.");
        const docId = UIHelper.extractDocIdFromUrl(window.location.href);
        
        if (docId) {
          const responseText = document.getElementById("aiResponse").textContent;
          
          GoogleDocsManager.updateGoogleDoc(docId, responseText)
            .then(() => {
              console.log("Google Doc updated successfully.");
              alert("Google Doc updated.");
            })
            .catch(err => {
              console.error("Error updating Google Doc:", err);
              alert("Error updating Google Doc: " + err.message);
            });
        } else {
          alert("Could not extract Document ID.");
        }
      } catch (error) {
        console.error("Error in Apply Inline event:", error);
        alert("Error: " + error.message);
      }
    }
  };