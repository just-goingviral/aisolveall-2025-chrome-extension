# Aisolveall Assistant

Aisolveall Assistant is a feature rich Chrome extension that integrates advanced AI capabilities from multiple providers—including OpenAI, Anthropic, Gemini, and Perplexity—with voice functionality via ElevenLabs TTS. It also offers project management (to store and retrieve past chats and documents), a dark mode toggle, voice input support, and more—all while storing data locally if desired.

## Features

- **Multi-Provider Support:**  
  - **OpenAI:** Fully integrated using the latest Chat Completions API (supports GPT 3.5 Turbo and GPT 4).  
  - **Anthropic, Gemini, Perplexity:** (Fully functioning endpoints are provided if you have valid API keys; otherwise, these serve as placeholders and require additional secure backend support.)

- **Projects Management:**  
  Create and manage projects so that your previous chats and documents are stored locally and used as context for future queries.

- **Voice Integration:**  
  - Voice input using the Web Speech API  
  - Text-to-speech via ElevenLabs TTS with voice parameter controls, caching, a stop button, and a loading spinner.

- **User Interface Enhancements:**  
  - Dark mode toggle to reduce eye strain  
  - A floating chat sidebar that can be toggled with a button or a keyboard shortcut (Ctrl+Shift+A)

- **Local Storage:**  
  All chat history and project data can be stored locally for offline use.

- **Security Enhancements:**  
  A strict Content Security Policy (CSP) is enforced in the manifest to help protect against script injection and other vulnerabilities.

## Installation

1. **Clone or Download the Repository:**  
   Place all files (including manifest.json, popup.html, popup.js, background.js, content.js, sample-docs.js, this README, TERMS_OF_SERVICE.md, and PRIVACY_POLICY.md) into a folder (e.g., `AisolveallAssistant`).

2. **Replace API Keys:**  
   In the code files (especially `popup.js` and `content.js`), replace placeholder strings such as `"YOUR_API_KEY"`, `"YOUR_ANTHROPIC_API_KEY"`, `"YOUR_GEMINI_API_KEY"`, `"YOUR_PERPLEXITY_API_KEY"`, and `"YOUR_ELEVENLABS_API_KEY"` with your actual API keys.  
   **Important:** For production, use a secure backend or proxy to protect sensitive information.

3. **Load the Extension in Chrome:**  
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** in the upper-right corner.
   - Click **Load unpacked** and select your extension folder.

4. **Test the Extension:**  
   Click the extension icon to open the popup and/or floating sidebar. Try switching between providers, using voice input and TTS, creating projects, toggling dark mode, and checking the local chat history.

## Usage

- **Provider Selection:**  
  Choose your provider from the dropdown. When OpenAI is selected, you can choose between GPT 3.5 Turbo and GPT 4. For Anthropic, Gemini, and Perplexity, ensure you have valid API endpoints and keys.

- **Projects:**  
  Create a new project or select an existing one to manage chat history and context.

- **Voice Functions:**  
  Use the microphone button for voice input, and the ElevenLabs TTS buttons to have responses read aloud.

- **Dark Mode:**  
  Toggle dark mode to switch the sidebar’s appearance.

## Contributing

Feel free to submit issues or pull requests to improve the extension. Contributions for secure API integrations, additional language support, or new features are welcome.

## License

This project is provided "as is" without warranty of any kind. See the Terms of Service and Privacy Policy for details.
