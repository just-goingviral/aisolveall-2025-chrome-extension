// Simplified popup.js
document.getElementById("send").addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value.trim();
    
    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }
    
    const responseDiv = document.getElementById("response");
    responseDiv.textContent = "Loading...";
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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" // Replace with your actual API key
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150
        })
      });
      
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        responseDiv.textContent = data.choices[0].message.content;
      } else {
        responseDiv.textContent = "No response content received.";
      }
    } catch (error) {
      console.error("Error:", error);
      responseDiv.textContent = "Error: " + error.message;
    }
  });