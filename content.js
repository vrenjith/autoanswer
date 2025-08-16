// Content script that reads page content and handles the floating popup
class AutoAnswerPopup {
  constructor() {
    this.popup = null;
    this.isLoading = false;
    this.initializePopup();
    this.addKeyboardShortcut();
  }

  initializePopup() {
    // Create floating popup element
    this.popup = document.createElement('div');
    this.popup.id = 'auto-answer-popup';
    this.popup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">AutoAnswer</span>
        <button class="close-btn" id="close-popup">×</button>
      </div>
      <div class="popup-content">
        <div class="input-section">
          <textarea id="question-input" placeholder="Ask a question about this page..." rows="2"></textarea>
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
    // Ctrl+Shift+A to toggle popup
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.togglePopup();
      }
    });
  }

  showPopup() {
    this.popup.style.display = 'block';
    this.popup.querySelector('#question-input').focus();
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
    new AutoAnswerPopup();
  });
} else {
  new AutoAnswerPopup();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePopup') {
    const popup = document.querySelector('#auto-answer-popup');
    if (popup) {
      const popupInstance = popup.autoAnswerInstance || new AutoAnswerPopup();
      popupInstance.togglePopup();
    }
  }
});
