/**
 * Aisolveall Assistant Content Script
 * This script creates the floating button and sidebar for the Aisolveall Assistant
 * Chrome extension, providing a unified interface for multiple AI providers
 * and voice assistants.
 */

(function() {
  // Global variables for API endpoints
  const ELEVENLABS_VOICES_ENDPOINT = "https://api.elevenlabs.io/v1/voices";
  const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
  const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
  const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

  // Global variables for sidebar and audio
  let currentAudio = null; // For playing ElevenLabs TTS audio
  let activeProject = null; // Holds the currently selected project ID
  let sidebarVisible = false;
  let sidebarEl = null;
  let apiKeysLoaded = false;
  
  // Initialize the extension
  async function initialize() {
    try {
      await loadApiKeys();
      apiKeysLoaded = true;
      console.log("Aisolveall Assistant content script loaded and API keys initialized.");
      
      // After keys are loaded, create the floating button
      createFloatingButton();
      
      // Set up message listener
      setupMessageListener();
    } catch (error) {
      console.error("Error initializing API keys:", error);
      // Still setup basic UI with warning about missing keys
      createFloatingButton();
      setupMessageListener();
    }
  }
  
  // Load API keys from storage
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
      // Provide empty object as fallback
      API_KEYS = {};
      return {};
    }
  }
  
  // Get an API key for the specified provider
  function getApiKey(provider) {
    return API_KEYS[provider] || null;
  }
  
  // Create the floating button for toggling the sidebar
  function createFloatingButton() {
    // === Insert Dark Mode CSS ===
    const darkModeCSS = `
      #aisolveall-sidebar.dark-mode {
        background-color: #333 !important;
        color: #fff !important;
      }
      #aisolveall-sidebar.dark-mode button {
        background-color: #555 !important;
        color: #fff !important;
      }
      #aisolveall-sidebar.dark-mode select,
      #aisolveall-sidebar.dark-mode input,
      #aisolveall-sidebar.dark-mode textarea {
        background-color: #444 !important;
        color: #fff !important;
      }
      .aisolveall-chat-history-item {
        margin-bottom: 10px;
        padding: 5px;
        border-bottom: 1px solid #ccc;
      }
      .aisolveall-chat-history-prompt {
        font-weight: bold;
      }
      .aisolveall-chat-history-response {
        margin-top: 5px;
      }
      .aisolveall-button {
        padding: 8px;
        margin: 2px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .aisolveall-primary {
        background-color: #4285f4;
        color: white;
      }
      .aisolveall-secondary {
        background-color: #5cb85c;
        color: white;
      }
      .aisolveall-warning {
        background-color: #f0ad4e;
        color: white;
      }
      .aisolveall-danger {
        background-color: #d9534f;
        color: white;
      }
    `;
    
    // Remove any existing style elements to avoid duplication
    const existingStyle = document.getElementById('aisolveall-style');
    if (existingStyle) existingStyle.remove();
    
    const styleEl = document.createElement("style");
    styleEl.id = 'aisolveall-style';
    styleEl.textContent = darkModeCSS;
    document.head.appendChild(styleEl);
    
    // Remove any existing buttons to avoid duplication
    const existingButton = document.getElementById('aisolveall-chat-button');
    if (existingButton) existingButton.remove();
    
    // === Create Floating Chat Button ===
    const chatButton = document.createElement("button");
    chatButton.id = 'aisolveall-chat-button';
    chatButton.textContent = "Aisolveall Chat";
    chatButton.style.position = "fixed";
    chatButton.style.bottom = "10px";
    chatButton.style.right = "10px";
    chatButton.style.zIndex = "10000";
    chatButton.style.padding = "10px 20px";
    chatButton.style.backgroundColor = "#4285f4";
    chatButton.style.color = "#fff";
    chatButton.style.border = "none";
    chatButton.style.borderRadius = "5px";
    chatButton.style.cursor = "pointer";
    chatButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    chatButton.setAttribute("aria-label", "Toggle Chat Sidebar");
    chatButton.setAttribute("role", "button");
    chatButton.tabIndex = 0;
    document.body.appendChild(chatButton);
    
    // Add keyboard accessibility
    chatButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSidebar();
      }
    });
    
    chatButton.addEventListener("click", () => {
      console.log("Chat button clicked.");
      toggleSidebar();
    });
  }
  
  // Set up message listener for background script communications
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Received message from background:", message);
      
      if (message.action === "toggleSidebar") {
        toggleSidebar();
        sendResponse({success: true});
        return true;
      }
      
      if (message.action === "summarize" && message.selectedText) {
        openSidebarWithPrompt(`Summarize this article:\n\n${message.selectedText}`);
        sendResponse({success: true});
        return true;
      }
      
      sendResponse({success: false, error: "Unknown action"});
      return true;
    });
  }
  
  // === Toggle Sidebar Visibility ===
  function toggleSidebar() {
    try {
      if (sidebarVisible) {
        console.log("Hiding sidebar.");
        if (sidebarEl) {
          // Clean up event listeners before removing
          cleanupSidebarEventListeners();
          sidebarEl.remove();
        }
        sidebarVisible = false;
      } else {
        console.log("Showing sidebar.");
        createSidebar();
        sidebarVisible = true;
      }
    } catch (error) {
      console.error("Error toggling sidebar:", error);
      alert("Error toggling sidebar: " + error.message);
    }
  }
  
  // Clean up event listeners when removing the sidebar
  function cleanupSidebarEventListeners() {
    // Stop any playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    // We don't need to manually remove event listeners from elements being removed
    // as they will be garbage collected, but we could do manual cleanup for complex cases
  }
  
  // === Open Sidebar and Pre-Populate Prompt ===
  function openSidebarWithPrompt(text) {
    try {
      if (!sidebarVisible) toggleSidebar();
      
      const promptArea = document.getElementById("aiPrompt");
      if (promptArea) {
        promptArea.value = text;
        console.log("Sidebar prompt pre-populated.");
      }
    } catch (error) {
      console.error("Error opening sidebar with prompt:", error);
    }
  }
  
  // === Create Sidebar UI ===
  function createSidebar() {
    try {
      // Check if there's already a sidebar
      if (document.getElementById("aisolveall-sidebar")) {
        document.getElementById("aisolveall-sidebar").remove();
      }
      
      // Main container for the sidebar
      sidebarEl = document.createElement("div");
      sidebarEl.id = "aisolveall-sidebar";
      Object.assign(sidebarEl.style, {
        position: "fixed",
        top: "0",
        right: "0",
        width: "350px",
        height: "100%",
        backgroundColor: "#fff",
        borderLeft: "1px solid #ccc",
        zIndex: "10000",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        overflow: "auto",
        resize: "horizontal",
        padding: "10px",
        fontFamily: "sans-serif"
      });
      
      console.log("Sidebar container created.");
      
      // === Header Section (Title and Close Button) ===
      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      
      const title = document.createElement("h3");
      title.textContent = "Aisolveall ChatGPT";
      title.style.margin = "0";
      header.appendChild(title);
      
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "X";
      closeBtn.className = "aisolveall-button aisolveall-danger";
      closeBtn.setAttribute("aria-label", "Close Chat Sidebar");
      closeBtn.setAttribute("role", "button");
      closeBtn.tabIndex = 0;
      
      closeBtn.addEventListener("click", () => {
        console.log("Close button clicked.");
        toggleSidebar();
      });
      
      // Add keyboard accessibility
      closeBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSidebar();
        }
      });
      
      header.appendChild(closeBtn);
      sidebarEl.appendChild(header);
      
      // === Dark Mode Toggle ===
      const darkModeToggle = document.createElement("button");
      darkModeToggle.textContent = "Toggle Dark Mode";
      darkModeToggle.className = "aisolveall-button";
      darkModeToggle.style.width = "100%";
      darkModeToggle.style.backgroundColor = "#333";
      darkModeToggle.style.color = "#fff";
      darkModeToggle.setAttribute("aria-label", "Toggle Dark Mode");
      darkModeToggle.setAttribute("role", "button");
      darkModeToggle.tabIndex = 0;
      
      sidebarEl.appendChild(darkModeToggle);
      
      darkModeToggle.addEventListener("click", () => {
        sidebarEl.classList.toggle("dark-mode");
        console.log("Dark mode toggled. Now:", sidebarEl.classList.contains("dark-mode") ? "ON" : "OFF");
      });
      
      sidebarEl.appendChild(document.createElement("hr"));
      
      // === Show API Keys Status ===
      if (!apiKeysLoaded) {
        const keyWarning = document.createElement("div");
        keyWarning.style.padding = "10px";
        keyWarning.style.marginBottom = "10px";
        keyWarning.style.backgroundColor = "#fff3cd";
        keyWarning.style.borderRadius = "4px";
        keyWarning.style.color = "#856404";
        keyWarning.textContent = "Warning: API keys not loaded. Some features may not work properly.";
        sidebarEl.appendChild(keyWarning);
      }
      
      // === Provider & Model Selection Section ===
      const providerSection = document.createElement("div");
      providerSection.style.marginBottom = "10px";
      
      const providerLabel = document.createElement("label");
      providerLabel.textContent = "Select Provider:";
      providerLabel.htmlFor = "providerSelect";
      providerSection.appendChild(providerLabel);
      
      const providerSelect = document.createElement("select");
      providerSelect.id = "providerSelect";
      providerSelect.style.width = "100%";
      providerSelect.style.marginBottom = "5px";
      providerSelect.tabIndex = 0;
      
      const providers = [
        { value: "openai", label: "OpenAI (GPT)" },
        { value: "anthropic", label: "Anthropic (Claude)" },
        { value: "gemini", label: "Google (Gemini)" },
        { value: "perplexity", label: "Perplexity" }
      ];
      
      providers.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.value;
        opt.textContent = p.label;
        providerSelect.appendChild(opt);
      });
      
      providerSection.appendChild(providerSelect);
      
      // Model selection dropdown appears only when provider is OpenAI
      const modelSelect = document.createElement("select");
      modelSelect.id = "modelSelect";
      modelSelect.style.width = "100%";
      modelSelect.style.marginBottom = "10px";
      modelSelect.tabIndex = 0;
      
      const openaiModels = [
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        { value: "gpt-4", label: "GPT-4" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" }
      ];
      
      openaiModels.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.value;
        opt.textContent = m.label;
        modelSelect.appendChild(opt);
      });
      
      // Show modelSelect only for OpenAI
      providerSelect.addEventListener("change", () => {
        if (providerSelect.value === "openai") {
          modelSelect.style.display = "block";
        } else {
          modelSelect.style.display = "none";
        }
      });
      
      providerSection.appendChild(modelSelect);
      sidebarEl.appendChild(providerSection);
      
      // === Projects Management Section ===
      const projectSection = document.createElement("div");
      projectSection.style.marginBottom = "10px";
      
      const projectLabel = document.createElement("label");
      projectLabel.textContent = "Select Project:";
      projectLabel.htmlFor = "projectSelect";
      projectSection.appendChild(projectLabel);
      
      const projectSelect = document.createElement("select");
      projectSelect.id = "projectSelect";
      projectSelect.style.width = "100%";
      projectSelect.style.marginBottom = "5px";
      projectSelect.tabIndex = 0;
      projectSection.appendChild(projectSelect);
      
      // Button to create a new project
      const createProjectBtn = document.createElement("button");
      createProjectBtn.textContent = "Create New Project";
      createProjectBtn.className = "aisolveall-button aisolveall-secondary";
      createProjectBtn.style.width = "100%";
      createProjectBtn.setAttribute("aria-label", "Create New Project");
      createProjectBtn.setAttribute("role", "button");
      createProjectBtn.tabIndex = 0;
      projectSection.appendChild(createProjectBtn);
      
      sidebarEl.appendChild(projectSection);
      
      // Load existing projects from storage
      loadProjects().then(projects => {
        console.log("Projects loaded:", projects);
        populateProjectSelect(projectSelect, projects);
      }).catch(error => {
        console.error("Error loading projects:", error);
      });
      
      createProjectBtn.addEventListener("click", () => {
        const projectName = prompt("Enter a new project name:");
        if (projectName) {
          createNewProject(projectName).then(projectId => {
            activeProject = projectId;
            // Reload projects list
            loadProjects().then(projects => {
              populateProjectSelect(projectSelect, projects);
              // Select newly created project
              projectSelect.value = projectId;
            });
          }).catch(error => {
            console.error("Error creating project:", error);
            alert("Error creating project: " + error.message);
          });
        }
      });
      
      // Project selection change event
      projectSelect.addEventListener("change", () => {
        activeProject = projectSelect.value;
        console.log("Active project changed to:", activeProject);
      });
      
      // === Preset Prompts Section ===
      const presetLabel = document.createElement("label");
      presetLabel.textContent = "Preset Prompts:";
      presetLabel.htmlFor = "presetPrompts";
      sidebarEl.appendChild(presetLabel);
      
      const presetSelect = document.createElement("select");
      presetSelect.id = "presetPrompts";
      presetSelect.style.width = "100%";
      presetSelect.style.marginBottom = "10px";
      presetSelect.tabIndex = 0;
      
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
        const opt = document.createElement("option");
        opt.value = p.value;
        opt.textContent = p.label;
        presetSelect.appendChild(opt);
      });
      
      sidebarEl.appendChild(presetSelect);
      
      presetSelect.addEventListener("change", () => {
        const promptArea = document.getElementById("aiPrompt");
        if (promptArea && presetSelect.value) {
          promptArea.value = presetSelect.value + "\n\n";
          console.log("Preset prompt selected:", presetSelect.value);
          // Reset the select back to default after selection
          setTimeout(() => {
            presetSelect.selectedIndex = 0;
          }, 100);
        }
      });
      
      // === ElevenLabs Voice Integration Section ===
      const voiceSection = document.createElement("div");
      voiceSection.style.marginBottom = "10px";
      
      const voiceLabel = document.createElement("label");
      voiceLabel.textContent = "Select Voice:";
      voiceLabel.htmlFor = "voiceSelect";
      voiceSection.appendChild(voiceLabel);
      
      const voiceSelect = document.createElement("select");
      voiceSelect.id = "voiceSelect";
      voiceSelect.style.width = "100%";
      voiceSelect.style.marginBottom = "5px";
      voiceSelect.tabIndex = 0;
      voiceSection.appendChild(voiceSelect);
      
      // Voice parameter controls (for ElevenLabs TTS)
      const stabilityInput = document.createElement("input");
      stabilityInput.type = "number";
      stabilityInput.min = "0";
      stabilityInput.max = "1";
      stabilityInput.step = "0.01";
      stabilityInput.value = "0.75";
      stabilityInput.placeholder = "Stability (0-1)";
      stabilityInput.style.width = "48%";
      stabilityInput.style.marginRight = "4%";
      stabilityInput.setAttribute("aria-label", "Stability");
      stabilityInput.tabIndex = 0;
      voiceSection.appendChild(stabilityInput);
      
      const similarityInput = document.createElement("input");
      similarityInput.type = "number";
      similarityInput.min = "0";
      similarityInput.max = "1";
      similarityInput.step = "0.01";
      similarityInput.value = "0.75";
      similarityInput.placeholder = "Similarity Boost (0-1)";
      similarityInput.style.width = "48%";
      similarityInput.setAttribute("aria-label", "Similarity Boost");
      similarityInput.tabIndex = 0;
      voiceSection.appendChild(similarityInput);
      
      // Buttons for ElevenLabs TTS actions
      const playVoiceBtn = document.createElement("button");
      playVoiceBtn.id = "playVoice";
      playVoiceBtn.textContent = "Play Voice";
      playVoiceBtn.className = "aisolveall-button aisolveall-primary";
      playVoiceBtn.style.width = "30%";
      playVoiceBtn.style.marginRight = "3%";
      playVoiceBtn.setAttribute("aria-label", "Play Response with Voice");
      playVoiceBtn.setAttribute("role", "button");
      playVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(playVoiceBtn);
      
      const stopVoiceBtn = document.createElement("button");
      stopVoiceBtn.id = "stopVoice";
      stopVoiceBtn.textContent = "Stop Voice";
      stopVoiceBtn.className = "aisolveall-button aisolveall-warning";
      stopVoiceBtn.style.width = "30%";
      stopVoiceBtn.style.marginRight = "3%";
      stopVoiceBtn.setAttribute("aria-label", "Stop Voice Playback");
      stopVoiceBtn.setAttribute("role", "button");
      stopVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(stopVoiceBtn);
      
      const cloneVoiceBtn = document.createElement("button");
      cloneVoiceBtn.id = "cloneVoice";
      cloneVoiceBtn.textContent = "Clone Voice";
      cloneVoiceBtn.className = "aisolveall-button aisolveall-secondary";
      cloneVoiceBtn.style.width = "30%";
      cloneVoiceBtn.setAttribute("aria-label", "Clone Your Voice");
      cloneVoiceBtn.setAttribute("role", "button");
      cloneVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(cloneVoiceBtn);
      
      // Loading spinner for TTS requests
      const ttsSpinner = document.createElement("span");
      ttsSpinner.id = "ttsSpinner";
      ttsSpinner.textContent = "⏳";
      ttsSpinner.style.display = "none";
      ttsSpinner.style.marginLeft = "5px";
      ttsSpinner.setAttribute("aria-hidden", "true");
      voiceSection.appendChild(ttsSpinner);
      
      sidebarEl.appendChild(voiceSection);
      
      // === Prompt Textarea ===
      const promptArea = document.createElement("textarea");
      promptArea.id = "aiPrompt";
      promptArea.placeholder = "Enter your prompt here...";
      promptArea.style.width = "100%";
      promptArea.style.height = "80px";
      promptArea.style.marginBottom = "10px";
      promptArea.setAttribute("aria-label", "Prompt Text Area");
      promptArea.tabIndex = 0;
      sidebarEl.appendChild(promptArea);
      
      // === Extra Buttons Row ===
      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.flexWrap = "wrap";
      btnRow.style.gap = "5px";
      btnRow.style.marginBottom = "10px";
      
      const voiceInputBtn = document.createElement("button");
      voiceInputBtn.id = "voiceInput";
      voiceInputBtn.textContent = "🎤";
      voiceInputBtn.className = "aisolveall-button";
      voiceInputBtn.title = "Voice Input";
      voiceInputBtn.style.flex = "1";
      voiceInputBtn.setAttribute("aria-label", "Activate Voice Input");
      voiceInputBtn.setAttribute("role", "button");
      voiceInputBtn.tabIndex = 0;
      btnRow.appendChild(voiceInputBtn);
      
      const useSelBtn = document.createElement("button");
      useSelBtn.id = "useSelected";
      useSelBtn.textContent = "Use Selected Text";
      useSelBtn.className = "aisolveall-button";
      useSelBtn.style.flex = "2";
      useSelBtn.setAttribute("aria-label", "Use Selected Text");
      useSelBtn.setAttribute("role", "button");
      useSelBtn.tabIndex = 0;
      btnRow.appendChild(useSelBtn);
      
      // Add email-specific button if on Gmail
      if (window.location.href.includes("mail.google.com")) {
        const emailReplyBtn = document.createElement("button");
        emailReplyBtn.id = "emailReply";
        emailReplyBtn.textContent = "Generate Email Reply";
        emailReplyBtn.className = "aisolveall-button";
        emailReplyBtn.style.flex = "2";
        emailReplyBtn.setAttribute("aria-label", "Generate Email Reply");
        emailReplyBtn.setAttribute("role", "button");
        emailReplyBtn.tabIndex = 0;
        btnRow.appendChild(emailReplyBtn);
        
        emailReplyBtn.addEventListener("click", () => {
          try {
            console.log("Generate Email Reply button clicked.");
            const composeBox = document.querySelector('div[aria-label="Message Body"], div[role="textbox"]');
            const emailText = composeBox ? composeBox.innerText : "";
            promptArea.value = "Generate a reply for this email:\n\n" + emailText;
          } catch (error) {
            console.error("Error generating email reply:", error);
            alert("Error generating email reply: " + error.message);
          }
        });
      }
      
      // Add Google Docs-specific button if on Google Docs
      if (window.location.href.includes("docs.google.com")) {
        const applyInlineBtn = document.createElement("button");
        applyInlineBtn.id = "applyInline";
        applyInlineBtn.textContent = "Apply Inline";
        applyInlineBtn.className = "aisolveall-button";
        applyInlineBtn.style.flex = "2";
        applyInlineBtn.setAttribute("aria-label", "Apply to Document");
        applyInlineBtn.setAttribute("role", "button");
        applyInlineBtn.tabIndex = 0;
        btnRow.appendChild(applyInlineBtn);
        
        applyInlineBtn.addEventListener("click", async () => {
          try {
            console.log("Apply Inline button clicked.");
            const docId = extractDocIdFromUrl(window.location.href);
            if (docId) {
              try {
                // Make sure Google API client is loaded and initialized
                if (typeof gapi === 'undefined' || !gapi.client) {
                  await initGoogleApiClient();
                }
                
                await updateGoogleDoc(docId, document.getElementById("aiResponse").textContent);
                console.log("Google Doc updated successfully.");
                alert("Google Doc updated.");
              } catch (err) {
                console.error("Error updating Google Doc:", err);
                alert("Error updating Google Doc: " + err.message);
              }
            } else {
              alert("Could not extract Document ID.");
            }
          } catch (error) {
            console.error("Error in Apply Inline event:", error);
            alert("Error: " + error.message);
          }
        });
      }
      
      sidebarEl.appendChild(btnRow);
      
      // === Send Button ===
      const sendBtn = document.createElement("button");
      sendBtn.id = "sendPrompt";
      sendBtn.textContent = "Send";
      sendBtn.className = "aisolveall-button aisolveall-primary";
      sendBtn.style.width = "100%";
      sendBtn.setAttribute("aria-label", "Send Prompt");
      sendBtn.setAttribute("role", "button");
      sendBtn.tabIndex = 0;
      sidebarEl.appendChild(sendBtn);
      
      // === Response Display ===
      const responseDiv = document.createElement("div");
      responseDiv.id = "aiResponse";
      responseDiv.style.marginTop = "10px";
      responseDiv.style.whiteSpace = "pre-wrap";
      responseDiv.style.borderTop = "1px solid #ccc";
      responseDiv.style.paddingTop = "10px";
      responseDiv.setAttribute("aria-live", "polite");
      sidebarEl.appendChild(responseDiv);
      
      // === Chat History Section (Global) ===
      const historyToggleBtn = document.createElement("button");
      historyToggleBtn.id = "toggleHistory";
      historyToggleBtn.textContent = "History";
      historyToggleBtn.className = "aisolveall-button aisolveall-secondary";
      historyToggleBtn.style.width = "100%";
      historyToggleBtn.style.marginTop = "10px";
      historyToggleBtn.setAttribute("aria-label", "Toggle Chat History");
      historyToggleBtn.setAttribute("aria-expanded", "false");
      historyToggleBtn.setAttribute("role", "button");
      historyToggleBtn.tabIndex = 0;
      sidebarEl.appendChild(historyToggleBtn);
      
      const historyDiv = document.createElement("div");
      historyDiv.id = "chatHistory";
      historyDiv.style.display = "none";
      historyDiv.style.marginTop = "10px";
      historyDiv.style.borderTop = "1px solid #ccc";
      historyDiv.style.paddingTop = "10px";
      sidebarEl.appendChild(historyDiv);
      
      document.body.appendChild(sidebarEl);
      
      console.log("Sidebar appended to page.");
      
      // === Event Listeners for Sidebar Buttons ===
      
      sendBtn.addEventListener("click", async () => {
        try {
          let promptText = promptArea.value.trim();
          
          if (!promptText) {
            alert("Please enter a prompt.");
            return;
          }
          
          // If an active project is selected, prepend its context
          if (activeProject) {
            const projectContext = await getProjectContext(activeProject);
            if (projectContext) {
              promptText = projectContext + "\n\n" + promptText;
            }
          }
          
          console.log("Sending prompt:", promptText);
          responseDiv.textContent = "Loading...";
          responseDiv.setAttribute("aria-busy", "true");
          
          // Determine the selected provider and model (if applicable)
          const provider = providerSelect.value;
          let model = null;
          
          if (provider === "openai") {
            model = modelSelect.value;
          }
          
          // Send the prompt using the selected provider
          try {
            const reply = await sendQueryToProvider(provider, promptText, model);
            
            responseDiv.textContent = reply;
            responseDiv.setAttribute("aria-busy", "false");
            console.log("Received response:", reply.substring(0, 100) + "...");
            
            // Save to chat history
            await saveChatHistory(promptArea.value.trim(), reply);
            
            if (activeProject) {
              await appendProjectHistory(activeProject, promptArea.value.trim(), reply);
            }
          } catch (error) {
            console.error("Error sending prompt:", error);
            responseDiv.textContent = "Error: " + error.message;
            responseDiv.setAttribute("aria-busy", "false");
          }
        } catch (error) {
          console.error("Error in send button click handler:", error);
          responseDiv.textContent = "Error: " + error.message;
          responseDiv.setAttribute("aria-busy", "false");
        }
      });
      
      useSelBtn.addEventListener("click", () => {
        try {
          const selectedText = window.getSelection().toString();
          if (selectedText) {
            promptArea.value = selectedText;
            console.log("Using selected text for prompt.");
          } else {
            alert("No text selected.");
          }
        } catch (error) {
          console.error("Error using selected text:", error);
        }
      });
      
      voiceInputBtn.addEventListener("click", () => {
        try {
          console.log("Voice input button clicked.");
          if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            alert("Voice recognition not supported in this browser.");
            return;
          }
          
          // Show visual indication that voice input is active
          voiceInputBtn.textContent = "🔴 Recording...";
          voiceInputBtn.style.backgroundColor = "#d9534f";
          
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.start();
          
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptArea.value += transcript;
            console.log("Voice input recognized:", transcript);
            
            // Reset button appearance
            voiceInputBtn.textContent = "🎤";
            voiceInputBtn.style.backgroundColor = "";
          };
          
          recognition.onerror = (err) => {
            console.error("Speech recognition error:", err);
            
            // Reset button appearance
            voiceInputBtn.textContent = "🎤";
            voiceInputBtn.style.backgroundColor = "";
            
            alert("Speech recognition error: " + err.error);
          };
          
          recognition.onend = () => {
            // Reset button appearance
            voiceInputBtn.textContent = "🎤";
            voiceInputBtn.style.backgroundColor = "";
          };
        } catch (error) {
          console.error("Error initializing voice input:", error);
          
          // Reset button appearance
          voiceInputBtn.textContent = "🎤";
          voiceInputBtn.style.backgroundColor = "";
          
          alert("Error initializing voice input: " + error.message);
        }
      });
      
      historyToggleBtn.addEventListener("click", async () => {
        try {
          if (historyDiv.style.display === "none") {
            await loadChatHistory();
            historyDiv.style.display = "block";
            historyToggleBtn.setAttribute("aria-expanded", "true");
            console.log("Chat history displayed.");
          } else {
            historyDiv.style.display = "none";
            historyToggleBtn.setAttribute("aria-expanded", "false");
            console.log("Chat history hidden.");
          }
        } catch (error) {
          console.error("Error toggling chat history:", error);
          alert("Error loading chat history: " + error.message);
        }
      });
      
      playVoiceBtn.addEventListener("click", async () => {
        try {
          console.log("Play Voice button clicked.");
          const responseText = responseDiv.textContent;
          
          if (!responseText || responseText === "Loading...") {
            alert("No response available to play.");
            return;
          }
          
          // Show loading spinner
          ttsSpinner.style.display = "inline";
          playVoiceBtn.disabled = true;
          
          const sanitizedText = sanitizeTextForVoice(responseText);
          const selectedVoiceId = voiceSelect.value;
          
          if (!selectedVoiceId) {
            alert("Please select a voice from the dropdown.");
            ttsSpinner.style.display = "none";
            playVoiceBtn.disabled = false;
            return;
          }
          
          console.log("Sending sanitized text to ElevenLabs TTS with voice ID:", selectedVoiceId);
          
          const stability = parseFloat(stabilityInput.value) || 0.75;
          const similarityBoost = parseFloat(similarityInput.value) || 0.75;
          
          // Get the API key using the function from api-keys-loader.js
          const elevenlabsKey = getApiKey('elevenlabs');
          
          if (!elevenlabsKey) {
            throw new Error("ElevenLabs API key not found. Please check api-keys.json file.");
          }
          
          // Stop any currently playing audio
          if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
          }
          
          const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?optimize_streaming_latency=0`, {
            method: "POST",
            headers: {
              "xi-api-key": elevenlabsKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: sanitizedText,
              voice_settings: {
                stability: stability,
                similarity_boost: similarityBoost
              }
            })
          });
          
          if (!ttsResponse.ok) {
            throw new Error(`Error from ElevenLabs: ${ttsResponse.status} ${ttsResponse.statusText}`);
          }
          
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          console.log("Received audio blob from ElevenLabs. Playing audio...");
          
          currentAudio = new Audio(audioUrl);
          
          // Clean up when audio finishes
          currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl); // Clean up the blob URL
            currentAudio = null;
          };
          
          currentAudio.play();
          
          ttsSpinner.style.display = "none";
          playVoiceBtn.disabled = false;
        } catch (err) {
          console.error("Error fetching voice audio:", err);
          ttsSpinner.style.display = "none";
          playVoiceBtn.disabled = false;
          alert("Error fetching voice audio: " + err.message);
        }
      });
      
      stopVoiceBtn.addEventListener("click", () => {
        try {
          console.log("Stop Voice button clicked.");
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            console.log("Audio stopped.");
          } else {
            console.log("No audio is currently playing.");
          }
        } catch (error) {
          console.error("Error stopping audio:", error);
          alert("Error stopping audio: " + error.message);
        }
      });
      
      cloneVoiceBtn.addEventListener("click", () => {
        console.log("Clone Voice button clicked.");
        alert("Voice cloning requires ElevenLabs Professional subscription. This feature will be available in a future update.");
      });
      
      // Initialize ElevenLabs voice dropdown
      fetchElevenLabsVoices(voiceSelect).catch(error => {
        console.error("Error fetching ElevenLabs voices:", error);
        
        // Add a default option in case fetching fails
        const defaultOpt = document.createElement("option");
        defaultOpt.value = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice ID
        defaultOpt.textContent = "Rachel (Default)";
        voiceSelect.appendChild(defaultOpt);
      });
      
    } catch (error) {
      console.error("Error creating sidebar:", error);
      alert("Error creating sidebar: " + error.message);
    }
  }
  
  /**
   * Sanitizes text for sending to ElevenLabs TTS
   * @param {string} text - The text to sanitize
   * @returns {string} Sanitized text
   */
  function sanitizeTextForVoice(text) {
    if (!text) return "";
    
    // Limit text length to avoid large API requests
    const MAX_CHARS = 5000;
    let sanitized = text;
    
    if (sanitized.length > MAX_CHARS) {
      sanitized = sanitized.substring(0, MAX_CHARS) + "... [Text truncated due to length]";
    }
    
    // Remove special characters/markdown that might cause issues
    sanitized = sanitized
      .replace(/```[\s\S]*?```/g, "Code block removed for voice.") // Remove code blocks
      .replace(/`.*?`/g, "") // Remove inline code
      .replace(/\[.*?\]\(.*?\)/g, "") // Remove markdown links
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/#{1,6}\s/g, "") // Remove heading markers
      .replace(/\n\s*[-*+]\s/g, "\n") // Remove list markers
      .replace(/\n\s*\d+\.\s/g, "\n") // Remove numbered list markers
      .replace(/\s{2,}/g, " ") // Compress multiple spaces
      .trim();
    
    return sanitized;
  }
  
  /**
   * Fetches available voices from ElevenLabs API
   * @param {HTMLSelectElement} voiceSelect - The select element to populate
   * @returns {Promise<void>}
   */
  async function fetchElevenLabsVoices(voiceSelect) {
    try {
      const elevenlabsKey = getApiKey('elevenlabs');
      
      if (!elevenlabsKey) {
        throw new Error("ElevenLabs API key not found");
      }
      
      const response = await fetch(ELEVENLABS_VOICES_ENDPOINT, {
        method: "GET",
        headers: {
          "xi-api-key": elevenlabsKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Clear existing options
      while (voiceSelect.firstChild) {
        voiceSelect.removeChild(voiceSelect.firstChild);
      }
      
      // Add a default empty option
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "-- Select a voice --";
      voiceSelect.appendChild(emptyOpt);
      
      // Add voices from API
      if (data.voices && Array.isArray(data.voices)) {
        data.voices.forEach(voice => {
          const opt = document.createElement("option");
          opt.value = voice.voice_id;
          opt.textContent = voice.name;
          voiceSelect.appendChild(opt);
        });
        
        console.log(`Loaded ${data.voices.length} voices from ElevenLabs`);
      } else {
        console.warn("No voices found in ElevenLabs response:", data);
      }
    } catch (error) {
      console.error("Error fetching ElevenLabs voices:", error);
      throw error;
    }
  }
  
  /**
   * Extracts document ID from a Google Docs URL
   * @param {string} url - The URL to extract from
   * @returns {string|null} The document ID or null if not found
   */
  function extractDocIdFromUrl(url) {
    try {
      const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Error extracting document ID:", e);
      return null;
    }
  }
  
  /**
   * Updates a Google Doc with the specified content
   * This requires the Google Docs API to be initialized
   * @param {string} documentId - The ID of the Google Doc
   * @param {string} content - The content to insert
   * @returns {Promise<any>} Result of the API call
   */
  async function updateGoogleDoc(documentId, content) {
    try {
      // This function should be imported from sample-docs.js
      // For compatibility, we're implementing it here as well
      if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.docs) {
        throw new Error("Google API client not initialized. Please refresh the page and try again.");
      }
      
      const response = await gapi.client.docs.documents.batchUpdate({
        documentId: documentId,
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content
            }
          }
        ]
      });
      
      console.log("Google Doc updated:", response);
      return response;
    } catch (error) {
      console.error("Error updating Google Doc:", error);
      throw error;
    }
  }
  
  /**
   * Initializes the Google API client
   * @returns {Promise<void>}
   */
  async function initGoogleApiClient() {
    return new Promise((resolve, reject) => {
      try {
        // Check if gapi is loaded
        if (typeof gapi === 'undefined') {
          reject(new Error("Google API client not loaded. Please refresh the page and try again."));
          return;
        }
        
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: getApiKey('google') || 'YOUR_API_KEY', // Fallback to placeholder
              clientId: 'YOUR_CLIENT_ID', // This should be replaced in production
              discoveryDocs: ['https://docs.googleapis.com/$discovery/rest?version=v1'],
              scope: 'https://www.googleapis.com/auth/documents'
            });
            
            resolve();
          } catch (error) {
            console.error('Error initializing Google API client:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error loading Google API client:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Loads projects from storage
   * @returns {Promise<Array>} Array of projects
   */
  // === Project Management Functions ===

// Load existing projects
async function loadProjects() {
  try {
    const projectSelect = document.getElementById('projectSelect');
    
    // Clear existing options
    projectSelect.innerHTML = '';
    
    // Add default option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- No Project Selected --';
    projectSelect.appendChild(defaultOpt);
    
    // Load projects from storage
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      
      projects.forEach(project => {
        const opt = document.createElement('option');
        opt.value = project.id;
        opt.textContent = project.name;
        projectSelect.appendChild(opt);
      });
      
      console.log(`Loaded ${projects.length} projects.`);
      
      // Set active project if one was previously selected
      chrome.storage.local.get('activeProject', function(result) {
        if (result.activeProject) {
          projectSelect.value = result.activeProject;
          activeProject = result.activeProject;
        }
      });
    });
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Create a new project
function createNewProject(projectName) {
  try {
    const projectId = 'project_' + Date.now();
    
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      
      // Add new project
      projects.push({
        id: projectId,
        name: projectName,
        created: new Date().toISOString(),
        history: []
      });
      
      // Save updated projects list
      chrome.storage.local.set({projects: projects}, function() {
        console.log('Project created:', projectName);
        
        // Update projects dropdown
        loadProjects();
        
        // Set as active project
        activeProject = projectId;
        chrome.storage.local.set({activeProject: projectId});
        
        // Update dropdown selection
        const projectSelect = document.getElementById('projectSelect');
        projectSelect.value = projectId;
      });
    });
  } catch (error) {
    console.error('Error creating project:', error);
  }
}

// Get project context (previous chat history)
function getProjectContext(projectId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get('projects', function(result) {
        const projects = result.projects || [];
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
          resolve(''); // No context if project not found
          return;
        }
        
        // Format context from history
        let context = `PROJECT CONTEXT: ${project.name}\n\n`;
        
        // Get last 5 entries or fewer
        const recentHistory = project.history.slice(-5);
        
        recentHistory.forEach((entry, index) => {
          context += `User: ${entry.prompt}\n`;
          context += `Assistant: ${entry.response}\n\n`;
        });
        
        resolve(context);
      });
    } catch (error) {
      console.error('Error getting project context:', error);
      reject(error);
    }
  });
}

// Append to project history
function appendProjectHistory(projectId, prompt, response) {
  try {
    chrome.storage.local.get('projects', function(result) {
      const projects = result.projects || [];
      const projectIndex = projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        console.error('Project not found:', projectId);
        return;
      }
      
      // Add to history
      projects[projectIndex].history.push({
        prompt: prompt,
        response: response,
        timestamp: new Date().toISOString()
      });
      
      // Save updated projects
      chrome.storage.local.set({projects: projects}, function() {
        console.log('Project history updated:', projectId);
      });
    });
  } catch (error) {
    console.error('Error appending project history:', error);
  }
}

// Save chat history (global)
function saveChatHistory(prompt, response) {
  try {
    chrome.storage.local.get('chatHistory', function(result) {
      const history = result.chatHistory || [];
      
      // Add new entry
      history.push({
        prompt: prompt,
        response: response,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the last 100 entries
      if (history.length > 100) {
        history.shift();
      }
      
      // Save updated history
      chrome.storage.local.set({chatHistory: history}, function() {
        console.log('Chat history saved.');
      });
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

// Load chat history (global)
function loadChatHistory() {
  try {
    const historyDiv = document.getElementById('chatHistory');
    
    // Clear existing history
    historyDiv.innerHTML = '';
    
    chrome.storage.local.get('chatHistory', function(result) {
      const history = result.chatHistory || [];
      
      if (history.length === 0) {
        historyDiv.textContent = 'No chat history yet.';
        return;
      }
      
      // Display last 20 entries in reverse order (newest first)
      const recentHistory = history.slice(-20).reverse();
      
      recentHistory.forEach((entry, index) => {
        // Create container for this chat entry
        const entryDiv = document.createElement('div');
        entryDiv.className = 'history-entry';
        entryDiv.style.marginBottom = '10px';
        entryDiv.style.borderBottom = '1px solid #ccc';
        entryDiv.style.paddingBottom = '10px';
        
        // Format timestamp
        const timestamp = new Date(entry.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        // Create prompt element
        const promptDiv = document.createElement('div');
        promptDiv.className = 'history-prompt';
        promptDiv.textContent = `Q: ${entry.prompt}`;
        promptDiv.style.fontWeight = 'bold';
        entryDiv.appendChild(promptDiv);
        
        // Create response element (truncated)
        const responseDiv = document.createElement('div');
        responseDiv.className = 'history-response';
        const truncatedResponse = entry.response.length > 100 ? 
                                 entry.response.substring(0, 100) + '...' : 
                                 entry.response;
        responseDiv.textContent = `A: ${truncatedResponse}`;
        entryDiv.appendChild(responseDiv);
        
        // Create timestamp element
        const timeDiv = document.createElement('div');
        timeDiv.className = 'history-time';
        timeDiv.textContent = formattedTime;
        timeDiv.style.fontSize = '0.8em';
        timeDiv.style.color = '#666';
        entryDiv.appendChild(timeDiv);
        
        // Create button to reuse this prompt
        const reuseBtn = document.createElement('button');
        reuseBtn.textContent = 'Reuse';
        reuseBtn.style.marginTop = '5px';
        reuseBtn.style.padding = '3px 8px';
        reuseBtn.addEventListener('click', () => {
          const promptArea = document.getElementById('aiPrompt');
          if (promptArea) {
            promptArea.value = entry.prompt;
            // Scroll back to prompt area
            promptArea.scrollIntoView();
            // Hide history
            historyDiv.style.display = 'none';
          }
        });
        entryDiv.appendChild(reuseBtn);
        
        // Add to history div
        historyDiv.appendChild(entryDiv);
      });
      
      console.log(`Loaded ${recentHistory.length} chat history entries.`);
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}
  
  /**
   * Populates the project select dropdown with available projects
   * @param {HTMLSelectElement} selectEl - The select element to populate
   * @param {Array} projects - Array of project objects
   */
  function populateProjectSelect(selectEl, projects) {
    // Clear existing options
    while (selectEl.firstChild) {
      selectEl.removeChild(selectEl.firstChild);
    }
    
    // Add default option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- No project selected --";
    selectEl.appendChild(defaultOpt);
    
    // Add projects
    if (Array.isArray(projects)) {
      projects.forEach(project => {
        const opt = document.createElement("option");
        opt.value = project.id;
        opt.textContent = project.name;
        selectEl.appendChild(opt);
      });
    }
    
    // Set active project if one exists
    if (activeProject) {
      selectEl.value = activeProject;
    }
  }
  
  /**
   * Creates a new project and saves it to storage
   * @param {string} name - The name of the project
   * @returns {Promise<string>} The ID of the created project
   */
  async function createNewProject(name) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['aisolveall_projects'], function(result) {
          const projects = result.aisolveall_projects || [];
          
          // Create a new project with a unique ID
          const projectId = 'proj_' + Date.now();
          const newProject = {
            id: projectId,
            name: name,
            created: new Date().toISOString(),
            context: "",
            history: []
          };
          
          // Add to projects array
          projects.push(newProject);
          
          // Save updated projects
          chrome.storage.local.set({ 'aisolveall_projects': projects }, function() {
            console.log("New project created:", newProject);
            resolve(projectId);
          });
        });
      } catch (error) {
        console.error("Error creating project:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Gets the context for a project
   * @param {string} projectId - The ID of the project
   * @returns {Promise<string>} The project context
   */
  async function getProjectContext(projectId) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['aisolveall_projects'], function(result) {
          const projects = result.aisolveall_projects || [];
          const project = projects.find(p => p.id === projectId);
          
          if (project) {
            // Return the context + a summary of recent history
            let context = project.context || "";
            
            // Add recent history if available
            if (project.history && project.history.length > 0) {
              const recentHistory = project.history.slice(-5); // Last 5 interactions
              const historyText = recentHistory.map(h => 
                `User: ${h.prompt}\nAI: ${h.response}`
              ).join("\n\n");
              
              if (historyText) {
                context += "\n\nRecent conversation history:\n" + historyText;
              }
            }
            
            resolve(context);
          } else {
            reject(new Error("Project not found"));
          }
        });
      } catch (error) {
        console.error("Error getting project context:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Appends a prompt and response to a project's history
   * @param {string} projectId - The ID of the project
   * @param {string} prompt - The user prompt
   * @param {string} response - The AI response
   * @returns {Promise<void>}
   */
  async function appendProjectHistory(projectId, prompt, response) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['aisolveall_projects'], function(result) {
          const projects = result.aisolveall_projects || [];
          const projectIndex = projects.findIndex(p => p.id === projectId);
          
          if (projectIndex >= 0) {
            // Initialize history array if it doesn't exist
            if (!projects[projectIndex].history) {
              projects[projectIndex].history = [];
            }
            
            // Add new history entry
            projects[projectIndex].history.push({
              timestamp: new Date().toISOString(),
              prompt: prompt,
              response: response
            });
            
            // Save updated projects
            chrome.storage.local.set({ 'aisolveall_projects': projects }, function() {
              console.log("Project history updated for:", projectId);
              resolve();
            });
          } else {
            reject(new Error("Project not found"));
          }
        });
      } catch (error) {
        console.error("Error appending project history:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Saves a prompt and response to the global chat history
   * @param {string} prompt - The user prompt
   * @param {string} response - The AI response
   * @returns {Promise<void>}
   */
  async function saveChatHistory(prompt, response) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['aisolveall_chat_history'], function(result) {
          const history = result.aisolveall_chat_history || [];
          
          // Add new history entry
          history.push({
            timestamp: new Date().toISOString(),
            prompt: prompt,
            response: response
          });
          
          // Limit history to last 100 entries to avoid storage limits
          const limitedHistory = history.slice(-100);
          
          // Save updated history
          chrome.storage.local.set({ 'aisolveall_chat_history': limitedHistory }, function() {
            console.log("Chat history updated.");
            resolve();
          });
        });
      } catch (error) {
        console.error("Error saving chat history:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Loads and displays the global chat history
   * @returns {Promise<void>}
   */
  async function loadChatHistory() {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(['aisolveall_chat_history'], function(result) {
          const history = result.aisolveall_chat_history || [];
          const historyDiv = document.getElementById("chatHistory");
          
          if (!historyDiv) {
            reject(new Error("History div not found"));
            return;
          }
          
          // Clear existing history
          historyDiv.innerHTML = "";
          
          if (history.length === 0) {
            historyDiv.textContent = "No chat history yet.";
            resolve();
            return;
          }
          
          // Display history (most recent first)
          history.reverse().forEach((item, index) => {
            const historyItem = document.createElement("div");
            historyItem.className = "aisolveall-chat-history-item";
            
            // Format timestamp
            const timestamp = new Date(item.timestamp);
            const formattedDate = timestamp.toLocaleDateString();
            const formattedTime = timestamp.toLocaleTimeString();
            
            // Create elements for each part
            const dateEl = document.createElement("div");
            dateEl.textContent = `${formattedDate} ${formattedTime}`;
            dateEl.style.fontSize = "0.8em";
            dateEl.style.color = "#666";
            
            const promptEl = document.createElement("div");
            promptEl.className = "aisolveall-chat-history-prompt";
            promptEl.textContent = item.prompt;
            
            const responseEl = document.createElement("div");
            responseEl.className = "aisolveall-chat-history-response";
            responseEl.textContent = item.response;
            
            // Add "Use This Chat" button
            const useBtn = document.createElement("button");
            useBtn.textContent = "Use This Chat";
            useBtn.className = "aisolveall-button";
            useBtn.style.marginTop = "5px";
            useBtn.style.fontSize = "0.8em";
            
            useBtn.addEventListener("click", () => {
              const promptArea = document.getElementById("aiPrompt");
              const responseDiv = document.getElementById("aiResponse");
              
              if (promptArea && responseDiv) {
                promptArea.value = item.prompt;
                responseDiv.textContent = item.response;
              }
            });
            
            // Add all elements to the history item
            historyItem.appendChild(dateEl);
            historyItem.appendChild(promptEl);
            historyItem.appendChild(responseEl);
            historyItem.appendChild(useBtn);
            
            // Add history item to history div
            historyDiv.appendChild(historyItem);
          });
          
          resolve();
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Sends a prompt to the specified AI provider
   * @param {string} provider - The provider to use (openai, anthropic, gemini, perplexity)
   * @param {string} prompt - The prompt to send
   * @param {string} model - The model to use (for OpenAI)
   * @returns {Promise<string>} The AI response
   */
  // === Provider API Call Function ===
async function sendQueryToProvider(provider, prompt, model) {
  try {
    // Get the API key for the selected provider
    const apiKey = await getApiKey(provider);
    
    if (!apiKey) {
      throw new Error(`API key for ${provider} not found. Please check api-keys.json file.`);
    }
    
    let response;
    
    // Handle different providers
    if (provider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error (${openaiResponse.status}): ${errorText}`);
      }
      
      const data = await openaiResponse.json();
      return data.choices[0].message.content;
    } 
    
    else if (provider === 'anthropic') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
      
      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorText}`);
      }
      
      const data = await anthropicResponse.json();
      return data.content[0].text;
    }
    
    else if (provider === 'gemini') {
      // Placeholder - replace with actual Gemini implementation
      return "Gemini integration not fully implemented yet.";
    }
    
    else if (provider === 'perplexity') {
      // Placeholder - replace with actual Perplexity implementation
      return "Perplexity integration not fully implemented yet.";
    }
    
    else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error('Error in sendQueryToProvider:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Fetch ElevenLabs voices and populate dropdown
async function fetchElevenLabsVoices(voiceSelect) {
  try {
    // Clear existing options
    voiceSelect.innerHTML = '';
    
    const elevenlabsKey = await getApiKey('elevenlabs');
    
    if (!elevenlabsKey) {
      throw new Error("ElevenLabs API key not found");
    }
    
    const response = await fetch(ELEVENLABS_VOICES_ENDPOINT, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenlabsKey
      }
    });
    
    if (!response.ok) {
      throw new Error("Error fetching ElevenLabs voices: " + response.statusText);
    }
    
    const data = await response.json();
    
    // Add voices to dropdown
    data.voices.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.voice_id;
      opt.textContent = voice.name;
      voiceSelect.appendChild(opt);
    });
    
    console.log(`Loaded ${data.voices.length} ElevenLabs voices.`);
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    
    // Add a default option to indicate the error
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Error loading voices';
    voiceSelect.appendChild(opt);
  }
}

// Helper function to sanitize text for voice synthesis
function sanitizeTextForVoice(text) {
  // Limit length to prevent timeouts or errors
  if (text.length > 5000) {
    text = text.substring(0, 5000) + '... (text truncated for voice synthesis)';
  }
  
  // Remove any problematic characters or formatting
  text = text.replace(/\n\n+/g, '\n\n') // Reduce multiple line breaks
             .replace(/\s+/g, ' ') // Reduce multiple spaces
             .replace(/[^\w\s.,?!;:'\"-]/g, ''); // Remove special characters
  
  return text;
}
  
  /**
   * Calls the OpenAI API
   * @param {string} apiKey - The OpenAI API key
   * @param {string} prompt - The prompt to send
   * @param {string} model - The model to use
   * @returns {Promise<string>} The AI response
   */
  async function callOpenAI(apiKey, prompt, model = "gpt-3.5-turbo") {
    try {
      const response = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  }
  
  /**
   * Calls the Anthropic API
   * @param {string} apiKey - The Anthropic API key
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response
   */
  async function callAnthropic(apiKey, prompt) {
    try {
      const response = await fetch(ANTHROPIC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-2",
          max_tokens_to_sample: 1000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error("Error calling Anthropic API:", error);
      throw error;
    }
  }
  
  /**
   * Calls the Gemini API
   * @param {string} apiKey - The Gemini API key
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response
   */
  async function callGemini(apiKey, prompt) {
    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }
  
  /**
   * Calls the Perplexity API
   * @param {string} apiKey - The Perplexity API key
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} The AI response
   */
  async function callPerplexity(apiKey, prompt) {
    try {
      const response = await fetch(PERPLEXITY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3-sonar-large-32k-online",
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Perplexity API:", error);
      throw error;
    }
  }
  
  // Start initialization when the script is loaded
  initialize();
  
})();