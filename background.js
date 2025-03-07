chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callOpenAI") {
      fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${request.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || "text-davinci-003",
          prompt: request.prompt,
          max_tokens: 100,
          temperature: 0.7
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({success: true, data: data});
      })
      .catch(error => {
        sendResponse({success: false, error: error.message});
      });
      
      return true; // Important! Keeps the message channel open for async response
    }
  });
  