// Simple validation script for the Chrome extension
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating AutoAnswer Chrome Extension...\n');

// Check required files
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check manifest.json validity
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log(`\n📋 Manifest Version: ${manifest.manifest_version}`);
  console.log(`📋 Extension Name: ${manifest.name}`);
  console.log(`📋 Version: ${manifest.version}`);
  
  if (manifest.manifest_version === 3) {
    console.log('✅ Using Manifest V3 (current standard)');
  } else {
    console.log('⚠️  Consider upgrading to Manifest V3');
  }
} catch (error) {
  console.log('❌ manifest.json is invalid JSON');
  allFilesExist = false;
}

// Check icons directory
if (fs.existsSync('icons')) {
  const iconFiles = fs.readdirSync('icons').filter(f => f.endsWith('.png'));
  if (iconFiles.length > 0) {
    console.log(`\n🎨 Found ${iconFiles.length} icon files`);
    iconFiles.forEach(icon => console.log(`   📁 ${icon}`));
  } else {
    console.log('\n⚠️  No PNG icons found in icons/ directory');
    console.log('   Add icon16.png, icon48.png, and icon128.png for a complete extension');
  }
} else {
  console.log('\n⚠️  Icons directory not found');
}

// Final status
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 Extension validation passed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Get a Google Gemini API key from https://makersuite.google.com/app/apikey');
  console.log('   2. Open Chrome and go to chrome://extensions/');
  console.log('   3. Enable Developer Mode');
  console.log('   4. Click "Load unpacked" and select this folder');
  console.log('   5. Configure your API key in the extension popup');
} else {
  console.log('❌ Extension validation failed - missing required files');
  process.exit(1);
}
