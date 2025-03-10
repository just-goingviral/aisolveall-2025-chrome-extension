/**
 * Aisolveall Assistant - Voice Manager
 * 
 * This module handles ElevenLabs voice operations.
 */

const VoiceManager = {
    // ElevenLabs API endpoint
    ELEVENLABS_VOICES_ENDPOINT: "https://api.elevenlabs.io/v1/voices",
    
    /**
     * Fetch ElevenLabs voices
     * @param {HTMLSelectElement} selectElement - The select element to populate
     */
    fetchElevenLabsVoices: async function(selectElement) {
      try {
        console.log("Fetching ElevenLabs voices...");
        
        if (!selectElement) {
          console.error("Voice select element not found");
          return;
        }
        
        // Try to load from cache first
        const cacheKey = "elevenLabsVoices";
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            console.log("Loaded voices from cache.");
            this.populateVoices(selectElement, parsed);
            return;
          } catch (e) {
            console.warn("Error parsing cached voices data:", e);
            // Continue to fetch fresh data
          }
        }
        
        // Get API key
        const elevenlabsKey = await ApiKeysManager.getApiKey('elevenlabs');
        
        if (!elevenlabsKey) {
          throw new Error("ElevenLabs API key not found");
        }
        
        const response = await fetch(this.ELEVENLABS_VOICES_ENDPOINT, {
          method: "GET",
          headers: {
            "xi-api-key": elevenlabsKey
          }
        });
        
        if (!response.ok) {
          throw new Error("Error fetching voices: " + response.statusText);
        }
        
        const data = await response.json();
        console.log("ElevenLabs voices fetched successfully");
        
        if (data.voices && Array.isArray(data.voices)) {
          // Cache the voices data
          localStorage.setItem(cacheKey, JSON.stringify(data.voices));
          this.populateVoices(selectElement, data.voices);
        } else {
          console.warn("No voices array found in ElevenLabs response.");
          
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No voices available";
          selectElement.appendChild(option);
        }
      } catch (error) {
        console.error("Error fetching ElevenLabs voices:", error);
        
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Error loading voices";
        selectElement.appendChild(option);
      }
    },
    
    /**
     * Populate voices in the select dropdown
     * @param {HTMLSelectElement} selectElement - The select element to populate
     * @param {Array} voices - Array of voice objects
     */
    populateVoices: function(selectElement, voices) {
      if (!selectElement) return;
      
      // Clear existing options
      selectElement.innerHTML = "";
      
      // Add a default option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select a voice --";
      selectElement.appendChild(defaultOption);
      
      // Add each voice
      voices.forEach(voice => {
        const option = document.createElement("option");
        option.value = voice.voice_id;
        option.textContent = voice.name;
        selectElement.appendChild(option);
      });
    },
    
    /**
     * Play text as voice using ElevenLabs TTS
     * @param {string} text - The text to convert to speech
     * @param {string} voiceId - The ElevenLabs voice ID
     */
    playTextAsVoice: async function(text, voiceId) {
      try {
        console.log("Sending text to ElevenLabs TTS with voice ID:", voiceId);
        
        // Get voice parameter values
        const stabilityInput = document.querySelector("#aisolveall-sidebar input[type='number']:nth-of-type(1)");
        const similarityInput = document.querySelector("#aisolveall-sidebar input[type='number']:nth-of-type(2)");
        
        const stability = stabilityInput ? parseFloat(stabilityInput.value) || 0.75 : 0.75;
        const similarityBoost = similarityInput ? parseFloat(similarityInput.value) || 0.75 : 0.75;
        
        // Get the API key
        const elevenlabsKey = await ApiKeysManager.getApiKey('elevenlabs');
        
        if (!elevenlabsKey) {
          throw new Error("ElevenLabs API key not found");
        }
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`, {
          method: "POST",
          headers: {
            "xi-api-key": elevenlabsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: text,
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
        
        // Stop any currently playing audio
        this.stopCurrentAudio();
        
        // Create and play the new audio
        AisolveallApp.state.currentAudio = new Audio(audioUrl);
        AisolveallApp.state.currentAudio.play();
        
        return true;
      } catch (error) {
        console.error("Error generating voice:", error);
        throw error;
      }
    },
    
    /**
     * Stop currently playing audio
     */
    stopCurrentAudio: function() {
      if (AisolveallApp.state.currentAudio) {
        AisolveallApp.state.currentAudio.pause();
        AisolveallApp.state.currentAudio.currentTime = 0;
        AisolveallApp.state.currentAudio = null;
        console.log("Audio stopped.");
        return true;
      } else {
        console.log("No audio is currently playing.");
        return false;
      }
    },
    
    /**
     * Check if audio is currently playing
     * @returns {boolean} True if audio is playing
     */
    isAudioPlaying: function() {
      return AisolveallApp.state.currentAudio !== null && 
             !AisolveallApp.state.currentAudio.paused;
    },
    
    /**
     * Initialize speech recognition for voice input
     * @param {HTMLElement} targetElement - Element to receive transcribed text
     * @param {Function} onStart - Callback when recording starts
     * @param {Function} onEnd - Callback when recording ends
     * @returns {Object|null} SpeechRecognition object or null if not supported
     */
    initSpeechRecognition: function(targetElement, onStart, onEnd) {
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        console.error("Speech recognition not supported in this browser");
        return null;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      
      // Handle results
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          if (targetElement) {
            targetElement.value += ' ' + finalTranscript;
          }
          console.log("Final transcript:", finalTranscript);
        }
        
        if (interimTranscript) {
          console.log("Interim transcript:", interimTranscript);
        }
      };
      
      // Handle events
      recognition.onstart = () => {
        console.log("Voice recognition started");
        if (onStart) onStart();
      };
      
      recognition.onend = () => {
        console.log("Voice recognition ended");
        if (onEnd) onEnd();
      };
      
      recognition.onerror = (event) => {
        console.error("Voice recognition error:", event.error);
        if (onEnd) onEnd();
      };
      
      return recognition;
    }
  };