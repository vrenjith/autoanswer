// Background service worker for Chrome extension
class GeminiAPI {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    this.loadApiKey();
  }

  async loadApiKey() {
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    this.apiKey = result.geminiApiKey;
  }

  async saveApiKey(apiKey) {
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    this.apiKey = apiKey;
  }

  async generateContent(prompt) {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please set your Gemini API key in the extension popup.');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response generated from Gemini');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  createPrompt(question, pageContent, pageTitle, pageUrl) {
    return `You are a helpful AI assistant. A user is asking a question about a web page. Here's the context:

Page Title: ${pageTitle}
Page URL: ${pageUrl}

Page Content:
${pageContent}

User Question: ${question}

Please provide a helpful and accurate answer based on the page content. If the question cannot be answered from the page content, let the user know and provide general guidance if possible. Keep your response concise but informative.`;
  }
}

const geminiAPI = new GeminiAPI();

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'askGemini') {
    handleGeminiRequest(request, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'saveApiKey') {
    geminiAPI.saveApiKey(request.apiKey).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (request.action === 'getApiKey') {
    chrome.storage.sync.get(['geminiApiKey']).then(result => {
      sendResponse({ apiKey: result.geminiApiKey || '' });
    });
    return true;
  }
});

async function handleGeminiRequest(request, sendResponse) {
  try {
    const { question, pageContent, pageTitle, pageUrl } = request;
    
    // Create the prompt
    const prompt = geminiAPI.createPrompt(question, pageContent, pageTitle, pageUrl);
    
    // Get response from Gemini
    const answer = await geminiAPI.generateContent(prompt);
    
    sendResponse({
      success: true,
      answer: answer
    });
  } catch (error) {
    console.error('Error handling Gemini request:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page or show welcome notification
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject content script if not already injected
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Toggle popup
    await chrome.tabs.sendMessage(tab.id, { action: 'togglePopup' });
  } catch (error) {
    console.error('Error toggling popup:', error);
  }
});
