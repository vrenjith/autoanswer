#!/bin/bash

# AutoAnswer Chrome Extension Installation Guide
# This script provides step-by-step instructions

echo "🚀 AutoAnswer Chrome Extension Setup"
echo "====================================="
echo ""

echo "📋 Required files check:"
files=("manifest.json" "background.js" "content.js" "content.css" "popup.html" "popup.js")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "📝 Installation Steps:"
echo ""
echo "1. 🔑 Get Google Gemini API Key:"
echo "   - Visit: https://makersuite.google.com/app/apikey"
echo "   - Click 'Create API Key'"
echo "   - Copy the generated key"
echo ""

echo "2. 🌐 Load Extension in Chrome:"
echo "   - Open Chrome browser"
echo "   - Go to: chrome://extensions/"
echo "   - Enable 'Developer mode' (top-right toggle)"
echo "   - Click 'Load unpacked'"
echo "   - Select this folder: $(pwd)"
echo ""

echo "3. ⚙️ Configure Extension:"
echo "   - Click the AutoAnswer extension icon in toolbar"
echo "   - Paste your API key"
echo "   - Click 'Save API Key'"
echo "   - Test the connection"
echo ""

echo "4. 🎯 Usage:"
echo "   - Method 1: Click extension icon"
echo "   - Method 2: Press Ctrl+Shift+A on any webpage"
echo "   - Ask questions about the page content"
echo ""

echo "⚠️  Note: You may need to add icon files to the icons/ directory"
echo "   for the extension to display properly in Chrome."
echo ""

echo "🎉 Your Chrome extension is ready!"
echo "For detailed instructions, see README.md"
