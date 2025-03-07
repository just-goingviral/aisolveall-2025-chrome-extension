(function() {
  // Global variables for API endpoints
  const ELEVENLABS_VOICES_ENDPOINT = "https://api.elevenlabs.io/v1/voices";

  // Global variables for sidebar and audio
  let currentAudio = null; // For playing ElevenLabs TTS audio
  let activeProject = null; // Holds the currently selected project ID
  let sidebarVisible = false;
  let sidebarEl = null;
  
  // Initialize by loading API keys
  loadApiKeys().then(() => {
    console.log("Aisolveall Assistant content script loaded and API keys initialized.");
    
    // After keys are loaded, create the floating button
    createFloatingButton();
    
    // Set up message listener
    setupMessageListener();
  }).catch(error => {
    console.error("Error initializing API keys:", error);
  });
  
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
    `;
    
    const styleEl = document.createElement("style");
    styleEl.textContent = darkModeCSS;
    document.head.appendChild(styleEl);
    
    // === Create Floating Chat Button ===
    const chatButton = document.createElement("button");
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
    chatButton.setAttribute("aria-label", "Toggle Chat Sidebar");
    chatButton.tabIndex = 0;
    document.body.appendChild(chatButton);
    
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
      }
      
      if (message.action === "summarize" && message.selectedText) {
        openSidebarWithPrompt(`Summarize this article:\n\n${message.selectedText}`);
      }
    });
  }
  
  // === Toggle Sidebar Visibility ===
  function toggleSidebar() {
    try {
      if (sidebarVisible) {
        console.log("Hiding sidebar.");
        if (sidebarEl) sidebarEl.remove();
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
      closeBtn.style.background = "#d9534f";
      closeBtn.style.border = "none";
      closeBtn.style.color = "#fff";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.padding = "2px 8px";
      closeBtn.style.borderRadius = "4px";
      closeBtn.setAttribute("aria-label", "Close Chat Sidebar");
      closeBtn.tabIndex = 0;
      
      closeBtn.addEventListener("click", () => {
        console.log("Close button clicked.");
        toggleSidebar();
      });
      
      header.appendChild(closeBtn);
      sidebarEl.appendChild(header);
      
      // === Dark Mode Toggle ===
      const darkModeToggle = document.createElement("button");
      darkModeToggle.textContent = "Toggle Dark Mode";
      darkModeToggle.style.width = "100%";
      darkModeToggle.style.padding = "8px";
      darkModeToggle.style.margin = "10px 0";
      darkModeToggle.style.backgroundColor = "#333";
      darkModeToggle.style.border = "none";
      darkModeToggle.style.color = "#fff";
      darkModeToggle.style.borderRadius = "4px";
      darkModeToggle.style.cursor = "pointer";
      darkModeToggle.tabIndex = 0;
      
      sidebarEl.appendChild(darkModeToggle);
      
      darkModeToggle.addEventListener("click", () => {
        sidebarEl.classList.toggle("dark-mode");
        console.log("Dark mode toggled. Now:", sidebarEl.classList.contains("dark-mode") ? "ON" : "OFF");
      });
      
      sidebarEl.appendChild(document.createElement("hr"));
      
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
        { value: "gpt-4", label: "GPT-4" }
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
      createProjectBtn.style.width = "100%";
      createProjectBtn.style.padding = "8px";
      createProjectBtn.style.backgroundColor = "#5cb85c";
      createProjectBtn.style.border = "none";
      createProjectBtn.style.color = "#fff";
      createProjectBtn.style.borderRadius = "4px";
      createProjectBtn.style.cursor = "pointer";
      createProjectBtn.tabIndex = 0;
      projectSection.appendChild(createProjectBtn);
      
      sidebarEl.appendChild(projectSection);
      
      // Load existing projects from storage
      loadProjects();
      
      createProjectBtn.addEventListener("click", () => {
        const projectName = prompt("Enter a new project name:");
        if (projectName) {
          createNewProject(projectName);
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
      similarityInput.tabIndex = 0;
      voiceSection.appendChild(similarityInput);
      
      // Buttons for ElevenLabs TTS actions
      const playVoiceBtn = document.createElement("button");
      playVoiceBtn.id = "playVoice";
      playVoiceBtn.textContent = "Play Voice";
      playVoiceBtn.style.width = "30%";
      playVoiceBtn.style.marginRight = "3%";
      playVoiceBtn.style.padding = "8px";
      playVoiceBtn.style.backgroundColor = "#4285f4";
      playVoiceBtn.style.border = "none";
      playVoiceBtn.style.color = "#fff";
      playVoiceBtn.style.borderRadius = "4px";
      playVoiceBtn.style.cursor = "pointer";
      playVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(playVoiceBtn);
      
      const stopVoiceBtn = document.createElement("button");
      stopVoiceBtn.id = "stopVoice";
      stopVoiceBtn.textContent = "Stop Voice";
      stopVoiceBtn.style.width = "30%";
      stopVoiceBtn.style.marginRight = "3%";
      stopVoiceBtn.style.padding = "8px";
      stopVoiceBtn.style.backgroundColor = "#f0ad4e";
      stopVoiceBtn.style.border = "none";
      stopVoiceBtn.style.color = "#fff";
      stopVoiceBtn.style.borderRadius = "4px";
      stopVoiceBtn.style.cursor = "pointer";
      stopVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(stopVoiceBtn);
      
      const cloneVoiceBtn = document.createElement("button");
      cloneVoiceBtn.id = "cloneVoice";
      cloneVoiceBtn.textContent = "Clone Voice";
      cloneVoiceBtn.style.width = "30%";
      cloneVoiceBtn.style.padding = "8px";
      cloneVoiceBtn.style.backgroundColor = "#5cb85c";
      cloneVoiceBtn.style.border = "none";
      cloneVoiceBtn.style.color = "#fff";
      cloneVoiceBtn.style.borderRadius = "4px";
      cloneVoiceBtn.style.cursor = "pointer";
      cloneVoiceBtn.tabIndex = 0;
      voiceSection.appendChild(cloneVoiceBtn);
      
      // Loading spinner for TTS requests
      const ttsSpinner = document.createElement("span");
      ttsSpinner.id = "ttsSpinner";
      ttsSpinner.textContent = "⏳";
      ttsSpinner.style.display = "none";
      ttsSpinner.style.marginLeft = "5px";
      voiceSection.appendChild(ttsSpinner);
      
      sidebarEl.appendChild(voiceSection);
      
      // === Prompt Textarea ===
      const promptArea = document.createElement("textarea");
      promptArea.id = "aiPrompt";
      promptArea.placeholder = "Enter your prompt here...";
      promptArea.style.width = "100%";
      promptArea.style.height = "80px";
      promptArea.style.marginBottom = "10px";
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
      voiceInputBtn.title = "Voice Input";
      voiceInputBtn.style.flex = "1";
      voiceInputBtn.tabIndex = 0;
      voiceInputBtn.setAttribute("aria-label", "Activate Voice Input");
      btnRow.appendChild(voiceInputBtn);
      
      const useSelBtn = document.createElement("button");
      useSelBtn.id = "useSelected";
      useSelBtn.textContent = "Use Selected Text";
      useSelBtn.style.flex = "2";
      useSelBtn.tabIndex = 0;
      btnRow.appendChild(useSelBtn);
      
      // Add email-specific button if on Gmail
      if (window.location.href.includes("mail.google.com")) {
        const emailReplyBtn = document.createElement("button");
        emailReplyBtn.id = "emailReply";
        emailReplyBtn.textContent = "Generate Email Reply";
        emailReplyBtn.style.flex = "2";
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
        applyInlineBtn.style.flex = "2";
        applyInlineBtn.tabIndex = 0;
        btnRow.appendChild(applyInlineBtn);
        
        applyInlineBtn.addEventListener("click", () => {
          try {
            console.log("Apply Inline button clicked.");
            const docId = extractDocIdFromUrl(window.location.href);
            if (docId) {
              updateGoogleDoc(docId, document.getElementById("aiResponse").textContent)
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
        });
      }
      
      sidebarEl.appendChild(btnRow);
      
      // === Send Button ===
      const sendBtn = document.createElement("button");
      sendBtn.id = "sendPrompt";
      sendBtn.textContent = "Send";
      sendBtn.style.width = "100%";
      sendBtn.style.padding = "8px";
      sendBtn.style.backgroundColor = "#4285f4";
      sendBtn.style.border = "none";
      sendBtn.style.color = "#fff";
      sendBtn.style.borderRadius = "4px";
      sendBtn.style.cursor = "pointer";
      sendBtn.tabIndex = 0;
      sidebarEl.appendChild(sendBtn);
      
      // === Response Display ===
      const responseDiv = document.createElement("div");
      responseDiv.id = "aiResponse";
      responseDiv.style.marginTop = "10px";
      responseDiv.style.whiteSpace = "pre-wrap";
      responseDiv.style.borderTop = "1px solid #ccc";
      responseDiv.style.paddingTop = "10px";
      sidebarEl.appendChild(responseDiv);
      
      // === Chat History Section (Global) ===
      const historyToggleBtn = document.createElement("button");
      historyToggleBtn.id = "toggleHistory";
      historyToggleBtn.textContent = "History";
      historyToggleBtn.style.width = "100%";
      historyToggleBtn.style.marginTop = "10px";
      historyToggleBtn.style.padding = "8px";
      historyToggleBtn.style.backgroundColor = "#5cb85c";
      historyToggleBtn.style.border = "none";
      historyToggleBtn.style.color = "#fff";
      historyToggleBtn.style.borderRadius = "4px";
      historyToggleBtn.style.cursor = "pointer";
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
          
          // Determine the selected provider and model (if applicable)
          const provider = providerSelect.value;
          let model = null;
          
          if (provider === "openai") {
            model = modelSelect.value;
          }
          
          // Send the prompt using the selected provider
          const reply = await sendQueryToProvider(provider, promptText, model);
          
          responseDiv.textContent = reply;
          console.log("Received response:", reply);
          
          saveChatHistory(promptArea.value.trim(), reply);
          
          if (activeProject) {
            appendProjectHistory(activeProject, promptArea.value.trim(), reply);
          }
        } catch (error) {
          console.error("Error sending prompt:", error);
          responseDiv.textContent = "Error: " + error.message;
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
          
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = "en-US";
          recognition.start();
          
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptArea.value += transcript;
            console.log("Voice input recognized:", transcript);
          };
          
          recognition.onerror = (err) => {
            console.error("Speech recognition error:", err);
          };
        } catch (error) {
          console.error("Error initializing voice input:", error);
        }
      });
      
      historyToggleBtn.addEventListener("click", () => {
        try {
          if (historyDiv.style.display === "none") {
            loadChatHistory();
            historyDiv.style.display = "block";
            console.log("Chat history displayed.");
          } else {
            historyDiv.style.display = "none";
            console.log("Chat history hidden.");
          }
        } catch (error) {
          console.error("Error toggling chat history:", error);
        }
      });
      
      playVoiceBtn.addEventListener("click", async () => {
        try {
          console.log("Play Voice button clicked.");
          const responseText = responseDiv.textContent;
          
          if (!responseText) {
            alert("No response available to play.");
            return;
          }
          
          ttsSpinner.style.display = "inline";
          
          const sanitizedText = sanitizeTextForVoice(responseText);
          const selectedVoiceId = voiceSelect.value;
          
          if (!selectedVoiceId) {
            alert("Please select a voice from the dropdown.");
            ttsSpinner.style.display = "none";
            return;
          }
          
          console.log("Sending sanitized text to ElevenLabs TTS with voice ID:", selectedVoiceId);
          
          const stability = parseFloat(stabilityInput.value) || 0.75;
          const similarityBoost = parseFloat(similarityInput.value) || 0.75;
          
          // Get the API key using the function from api-keys-loader.js
          const elevenlabsKey = await getApiKey('elevenlabs');
          
          if (!elevenlabsKey) {
            throw new Error("ElevenLabs API key not found");
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
            throw new Error("Error from ElevenLabs: " + ttsResponse.statusText);
          }
          
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          console.log("Received audio blob from ElevenLabs. Playing audio...");
          
          currentAudio = new Audio(audioUrl);
          currentAudio.play();
          
          ttsSpinner.style.display = "none";
        } catch (err) {
          console.error("Error fetching voice audio:", err);
          ttsSpinner.style.display = "none";
          alert("Error fetching voice audio: " + err.message);
        }
      });
      
      stopVoiceBtn.addEventListener("click", () => {
        try {
          console.log("Stop Voice button clicked.");
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            console.log("Audio stopped.");
          } else {
            alert("No audio is currently playing.");
          }
        } catch (error) {
          console.error("Error stopping audio:", error);
          alert("Error stopping audio: " + error.message);
        }
      });
      
      cloneVoiceBtn.addEventListener("click", () => {
        console.log("Clone Voice button clicked.");
        alert("Voice cloning functionality is not implemented in this demo.");
      });
      
      // Initialize ElevenLabs voice dropdown
      fetchElevenLabsVoices(voiceSelect);
      
    } catch (error) {
      console.error("Error creating sidebar:", error);
      alert("Error creating sidebar: " + error.message);
    }
  }
  
  // === Provider API Call Function ===
  async function sendQueryToProvider(provider, prompt, model) {
    try {
      // Get the API key for the selected provider
      const apiKey = await getApiKey(provider);
      
      if (!apiKey) {
        throw new Error(`API key for ${provider} not found. Please check api-keys.json file.`);
      }}