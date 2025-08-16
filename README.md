# AutoAnswer Chrome Extension

A Chrome extension that reads webpage content and provides AI-powered answers using Google Gemini API. The extension displays a floating popup in the top-right corner where users can ask questions about the current page.

## Features

- 🤖 **AI-Powered Answers**: Uses Google Gemini API to analyze page content and answer questions
- 📄 **Intelligent Content Extraction**: Automatically extracts main content from web pages
- 🎯 **Floating Popup Interface**: Non-intrusive popup that appears in the top-right corner
- ⌨️ **Keyboard Shortcuts**: Quick access with Ctrl+Shift+A
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Responsive**: Works on all screen sizes
- 🔄 **Draggable Interface**: Move the popup anywhere on the page

## Installation

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated API key

### 2. Install the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the AutoAnswer folder
5. The extension should now appear in your extensions list

### 3. Configure API Key

1. Click the AutoAnswer extension icon in the toolbar
2. Paste your Gemini API key in the configuration popup
3. Click "Save API Key"
4. Test the connection to ensure it's working

### 4. Add Icons (Optional)

For a complete installation, add these PNG icon files to the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Usage

### Method 1: Extension Icon
1. Click the AutoAnswer icon in the Chrome toolbar
2. A popup will appear in the top-right corner of the page

### Method 2: Keyboard Shortcut
1. Press `Ctrl+Shift+A` on any webpage
2. The popup will toggle on/off

### Asking Questions
1. Type your question in the text area
2. Click "Ask Gemini" or press Enter
3. Wait for the AI response to appear
4. The popup can be dragged around the page if needed

## How It Works

1. **Content Extraction**: The extension analyzes the current webpage and extracts the main content, removing navigation, ads, and other non-essential elements.

2. **Question Processing**: When you ask a question, it's combined with the page content and sent to the Google Gemini API.

3. **AI Response**: Gemini analyzes the content and provides a contextual answer based on the page information.

4. **Display**: The answer is formatted and displayed in the popup with proper styling.

## File Structure

```
AutoAnswer/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API communication
├── content.js            # Content script for page interaction
├── content.css           # Styles for the floating popup
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Configuration

### API Settings
- The extension stores your API key securely in Chrome's sync storage
- API keys are encrypted and synced across your Chrome devices
- You can update or remove the API key anytime through the popup

### Keyboard Shortcuts
- `Ctrl+Shift+A`: Toggle the AutoAnswer popup
- `Enter`: Ask question (when focused in text area)
- `Shift+Enter`: New line in question text area

## Privacy & Security

- **Local Processing**: Page content is processed locally before sending to Gemini
- **Secure Storage**: API keys are stored securely using Chrome's storage API
- **No Data Collection**: The extension doesn't collect or store personal data
- **Content Filtering**: Only main page content is sent to the API, excluding ads and tracking elements

## Troubleshooting

### Extension Not Working
1. Check if Developer Mode is enabled in Chrome extensions
2. Reload the extension from `chrome://extensions/`
3. Refresh the webpage you're trying to use it on

### API Issues
1. Verify your Gemini API key is correct
2. Check your internet connection
3. Ensure the API key has proper permissions
4. Test the connection using the "Test API Connection" button

### Popup Not Appearing
1. Try clicking the extension icon instead of using keyboard shortcut
2. Check if the page has content security policies blocking the extension
3. Try refreshing the page and using the extension again

### Content Not Being Read
1. The extension works best on articles, blog posts, and content-heavy pages
2. Some dynamic content may not be captured immediately
3. Try scrolling down to load more content before asking questions

## Limitations

- **Token Limits**: Very long pages may be truncated to fit within API token limits
- **Dynamic Content**: Some JavaScript-generated content may not be captured
- **Rate Limits**: Google Gemini API has rate limits that may affect usage
- **Language Support**: Works best with English content

## Development

### Local Development
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the reload button on the AutoAnswer extension
4. Test your changes

### Adding Features
- Content script modifications: Edit `content.js` and `content.css`
- API functionality: Modify `background.js`
- Popup interface: Update `popup.html` and `popup.js`

## License

This project is open source. Feel free to modify and distribute as needed.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your API key and permissions
3. Test on different websites
4. Check the Chrome developer console for errors

## Version History

### v1.0 (Current)
- Initial release
- Basic page content reading
- Gemini API integration
- Floating popup interface
- Keyboard shortcuts
- Drag and drop functionality
