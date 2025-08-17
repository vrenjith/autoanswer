// Background service worker for Chrome extension
class GeminiAPI {
  constructor() {
    this.apiKey = null;
    // Try different model names in order of preference
    this.availableModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro', 
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    this.currentModel = this.availableModels[0]; // Default to gemini-2.0-flash
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.currentModel}:generateContent`;
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

    // Try different models if one fails
    for (let i = 0; i < this.availableModels.length; i++) {
      const model = this.availableModels[i];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.candidates && data.candidates.length > 0) {
            // Update current model if this one worked
            this.currentModel = model;
            this.baseURL = url;
            return data.candidates[0].content.parts[0].text;
          } else {
            throw new Error('No response generated from Gemini');
          }
        } else {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // If it's a model not found error and we have more models to try, continue
          if (errorMessage.includes('not found') && i < this.availableModels.length - 1) {
            console.log(`Model ${model} not available, trying next model...`);
            continue;
          } else {
            throw new Error(errorMessage);
          }
        }
      } catch (error) {
        // If it's a network error or the last model, throw the error
        if (i === this.availableModels.length - 1) {
          console.error('Gemini API Error:', error);
          throw error;
        } else {
          console.log(`Error with model ${model}, trying next: ${error.message}`);
          continue;
        }
      }
    }

    throw new Error('All available Gemini models failed. Please check your API key and try again.');
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
    // Create context menu for configuration
    chrome.contextMenus.create({
      id: 'configure-screenreader',
      title: 'Configure ScreenReader API Key',
      contexts: ['action']
    });
    
    // Show welcome notification
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'configure-screenreader') {
    // Open configuration page
    chrome.tabs.create({
      url: chrome.runtime.getURL('config.html')
    });
  }
});

// Handle extension icon click - now activates content script
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if API key is configured first
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    
    if (!result.geminiApiKey) {
      // No API key configured - open configuration
      chrome.tabs.create({
        url: chrome.runtime.getURL('config.html')
      });
      return;
    }
    
    // API key exists - activate the reading interface
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Inject CSS if needed
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
    
    // Toggle popup
    await chrome.tabs.sendMessage(tab.id, { action: 'togglePopup' });
    
  } catch (error) {
    console.error('Error activating ScreenReader:', error);
    
    // Fallback - open configuration if there's an error
    chrome.tabs.create({
      url: chrome.runtime.getURL('config.html')
    });
  }
});
