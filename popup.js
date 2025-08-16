// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const saveKeyButton = document.getElementById('save-key');
  const testConnectionButton = document.getElementById('test-connection');
  const saveMessage = document.getElementById('save-message');
  const testMessage = document.getElementById('test-message');
  const statusIndicator = document.getElementById('status-indicator');

  // Load existing API key
  loadApiKey();

  // Save API key
  saveKeyButton.addEventListener('click', saveApiKey);

  // Test connection
  testConnectionButton.addEventListener('click', testConnection);

  // Enable test button when API key is entered
  apiKeyInput.addEventListener('input', function() {
    testConnectionButton.disabled = !apiKeyInput.value.trim();
    updateStatusIndicator();
  });

  async function loadApiKey() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
      if (response.apiKey) {
        apiKeyInput.value = response.apiKey;
        testConnectionButton.disabled = false;
        updateStatusIndicator(true);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage(saveMessage, 'Please enter an API key', 'error');
      return;
    }

    // Basic validation of API key format
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      showMessage(saveMessage, 'Invalid API key format. Please check your key.', 'error');
      return;
    }

    saveKeyButton.disabled = true;
    saveKeyButton.textContent = 'Saving...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveApiKey',
        apiKey: apiKey
      });

      if (response.success) {
        showMessage(saveMessage, 'API key saved successfully!', 'success');
        testConnectionButton.disabled = false;
        updateStatusIndicator(true);
      } else {
        showMessage(saveMessage, 'Failed to save API key: ' + response.error, 'error');
        updateStatusIndicator(false);
      }
    } catch (error) {
      showMessage(saveMessage, 'Error saving API key: ' + error.message, 'error');
      updateStatusIndicator(false);
    }

    saveKeyButton.disabled = false;
    saveKeyButton.textContent = 'Save API Key';
  }

  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage(testMessage, 'Please enter an API key first', 'error');
      return;
    }

    testConnectionButton.disabled = true;
    testConnectionButton.textContent = 'Testing...';

    try {
      // Test with a simple prompt
      const testPrompt = 'Hello! Please respond with "Connection successful" if you can read this.';
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
          showMessage(testMessage, '✅ Connection successful! API key is working.', 'success');
          updateStatusIndicator(true);
        } else {
          showMessage(testMessage, 'Unexpected response format from API', 'error');
          updateStatusIndicator(false);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        showMessage(testMessage, `❌ Connection failed: ${errorMessage}`, 'error');
        updateStatusIndicator(false);
      }
    } catch (error) {
      showMessage(testMessage, `❌ Connection failed: ${error.message}`, 'error');
      updateStatusIndicator(false);
    }

    testConnectionButton.disabled = false;
    testConnectionButton.textContent = 'Test API Connection';
  }

  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  function updateStatusIndicator(isConnected = null) {
    if (isConnected === null) {
      // Check if API key exists
      isConnected = apiKeyInput.value.trim().length > 0;
    }
    
    statusIndicator.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
  }

  // Handle keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target === apiKeyInput) {
      e.preventDefault();
      saveApiKey();
    }
  });
});
