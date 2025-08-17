// Content script that handles text selection and AI analysis
class ScreenReaderPopup {
  constructor() {
    this.popup = null;
    this.isLoading = false;
    this.selectedText = '';
    this.selectionPosition = { x: 0, y: 0 };
    this.initializePopup();
    this.addKeyboardShortcut();
    this.addSelectionListener();
  }

  addSelectionListener() {
    // Track text selection
    document.addEventListener('mouseup', (e) => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0) {
        this.selectedText = selectedText;
        // Store position near the selection
        this.selectionPosition = {
          x: e.clientX,
          y: e.clientY
        };
      }
    });

    // Clear selection tracking when clicking elsewhere
    document.addEventListener('click', (e) => {
      // Don't clear if clicking on our popup
      if (e.target.closest('#screenreader-popup')) {
        return;
      }
      
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().trim().length === 0) {
          this.selectedText = '';
        }
      }, 100);
    });
  }

  initializePopup() {
    // Create floating popup element
    this.popup = document.createElement('div');
    this.popup.id = 'screenreader-popup';
    this.popup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">ScreenReader</span>
        <button class="close-btn" id="close-popup">×</button>
      </div>
      <div class="popup-content">
        <div class="selected-text-section" id="selected-text-section" style="display: none;">
          <div class="selected-text-label">Selected Text:</div>
          <div class="selected-text-content" id="selected-text-content"></div>
        </div>
        <div class="input-section">
          <textarea id="question-input" placeholder="Select text and press Ctrl+Shift+A, or ask a question..." rows="2"></textarea>
          <button id="ask-btn">Ask Gemini</button>
        </div>
        <div class="answer-section" id="answer-section" style="display: none;">
          <div class="answer-content" id="answer-content"></div>
        </div>
        <div class="loading" id="loading" style="display: none;">
          <div class="spinner"></div>
          <span>Getting answer from Gemini...</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.popup);
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    const closeBtn = this.popup.querySelector('#close-popup');
    closeBtn.addEventListener('click', () => this.hidePopup());

    // Ask button
    const askBtn = this.popup.querySelector('#ask-btn');
    askBtn.addEventListener('click', () => this.handleQuestion());

    // Enter key in textarea
    const questionInput = this.popup.querySelector('#question-input');
    questionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleQuestion();
      }
    });

    // Drag functionality
    this.makeDraggable();
  }

  makeDraggable() {
    const header = this.popup.querySelector('.popup-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.popup.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      this.popup.style.left = Math.max(0, initialX + dx) + 'px';
      this.popup.style.top = Math.max(0, initialY + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'grab';
    });
  }

  addKeyboardShortcut() {
    // Ctrl+Shift+A to process selected text or toggle popup
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        
        // Check if there's selected text
        if (this.selectedText.length > 0) {
          // Process selected text automatically
          this.processSelectedText();
        } else {
          // No selection - show popup for manual input
          this.togglePopup();
        }
      }
    });
  }

  async processSelectedText() {
    // Position popup near the selection
    this.positionPopupNearSelection();
    this.showPopup();
    
    // Show the selected text in the popup
    const selectedTextSection = this.popup.querySelector('#selected-text-section');
    const selectedTextContent = this.popup.querySelector('#selected-text-content');
    
    selectedTextContent.textContent = this.selectedText;
    selectedTextSection.style.display = 'block';
    
    // Automatically process the selected text
    await this.analyzeSelectedText();
  }

  positionPopupNearSelection() {
    // Position popup near the selection, but keep it visible
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 350;
    const popupHeight = 300;
    
    let x = this.selectionPosition.x + 20; // Offset to avoid covering selection
    let y = this.selectionPosition.y - 50;
    
    // Keep popup within viewport
    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 20;
    }
    if (y + popupHeight > viewportHeight) {
      y = this.selectionPosition.y - popupHeight - 20;
    }
    if (x < 20) x = 20;
    if (y < 20) y = 20;
    
    this.popup.style.left = x + 'px';
    this.popup.style.top = y + 'px';
    this.popup.style.right = 'auto'; // Override default positioning
  }

  async analyzeSelectedText() {
    this.showLoading();
    
    try {
      // Send selected text to Gemini for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'askGemini',
        question: 'Please analyze and explain this text. Provide a clear summary and any key insights:',
        pageContent: this.selectedText,
        pageUrl: window.location.href,
        pageTitle: document.title
      });

      this.hideLoading();
      
      if (response.success) {
        this.showAnswer(response.answer);
      } else {
        this.showError(response.error);
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to analyze selected text: ' + error.message);
    }
  }

  showPopup() {
    this.popup.style.display = 'block';
    
    // Only focus input if no selected text (manual mode)
    if (this.selectedText.length === 0) {
      this.popup.querySelector('#question-input').focus();
    }
  }

  hidePopup() {
    this.popup.style.display = 'none';
    this.resetPopup();
  }

  togglePopup() {
    if (this.popup.style.display === 'block') {
      this.hidePopup();
    } else {
      this.showPopup();
    }
  }

  resetPopup() {
    this.popup.querySelector('#question-input').value = '';
    this.popup.querySelector('#answer-section').style.display = 'none';
    this.popup.querySelector('#loading').style.display = 'none';
    this.popup.querySelector('#selected-text-section').style.display = 'none';
    
    // Reset to default position
    this.popup.style.top = '20px';
    this.popup.style.right = '20px';
    this.popup.style.left = 'auto';
  }

  async handleQuestion() {
    if (this.isLoading) return;

    const questionInput = this.popup.querySelector('#question-input');
    const question = questionInput.value.trim();
    
    if (!question) {
      questionInput.focus();
      return;
    }

    this.showLoading();

    try {
      // Get page content
      const pageContent = this.extractPageContent();
      
      // Send to background script for Gemini API call
      const response = await chrome.runtime.sendMessage({
        action: 'askGemini',
        question: question,
        pageContent: pageContent,
        pageUrl: window.location.href,
        pageTitle: document.title
      });

      this.hideLoading();
      
      if (response.success) {
        this.showAnswer(response.answer);
      } else {
        this.showError(response.error);
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Failed to get answer: ' + error.message);
    }
  }

  extractPageContent() {
    // Remove scripts, styles, and other non-content elements
    const content = document.cloneNode(true);
    const elementsToRemove = content.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, #auto-answer-popup');
    elementsToRemove.forEach(el => el.remove());

    // Get main content
    const mainContent = content.querySelector('main, article, .content, .post, .entry') || content.querySelector('body');
    
    // Extract text content
    let text = mainContent ? mainContent.textContent : document.body.textContent;
    
    // Clean up the text
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit content length (Gemini has token limits)
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '...';
    }

    return text;
  }

  showLoading() {
    this.isLoading = true;
    this.popup.querySelector('#loading').style.display = 'block';
    this.popup.querySelector('#answer-section').style.display = 'none';
    this.popup.querySelector('#ask-btn').disabled = true;
  }

  hideLoading() {
    this.isLoading = false;
    this.popup.querySelector('#loading').style.display = 'none';
    this.popup.querySelector('#ask-btn').disabled = false;
  }

  showAnswer(answer) {
    const answerSection = this.popup.querySelector('#answer-section');
    const answerContent = this.popup.querySelector('#answer-content');
    
    // Convert markdown-like formatting to HTML
    const formattedAnswer = this.formatAnswer(answer);
    answerContent.innerHTML = formattedAnswer;
    answerSection.style.display = 'block';
  }

  showError(error) {
    const answerSection = this.popup.querySelector('#answer-section');
    const answerContent = this.popup.querySelector('#answer-content');
    
    answerContent.innerHTML = `<div class="error">❌ ${error}</div>`;
    answerSection.style.display = 'block';
  }

  formatAnswer(text) {
    // Basic markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/, '<p>$1</p>');
  }
}

// Initialize the popup when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ScreenReaderPopup();
  });
} else {
  new ScreenReaderPopup();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePopup') {
    const popup = document.querySelector('#screenreader-popup');
    if (popup) {
      const popupInstance = popup.screenReaderInstance || new ScreenReaderPopup();
      popupInstance.togglePopup();
    }
  }
});
