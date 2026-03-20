# PhishShield Browser Extension

Real-time phishing detection for Chrome and Firefox browsers.

## Features

- **URL Analysis**: Check the current tab URL for phishing indicators
- **Email Analysis**: Paste suspicious emails to detect phishing attempts
- **Real-time Detection**: Uses ML-powered analysis with WHOIS lookups and threat intelligence
- **Visual Alerts**: Color-coded risk indicators (Green = Safe, Amber = Suspicious, Red = Phishing)
- **Session Stats**: Track your scanning activity
- **Link Highlighting**: Automatically highlights potentially suspicious links on web pages

## Installation

### Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this `browser-extension` folder
5. The PhishShield icon will appear in your toolbar

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file from this folder
4. The PhishShield icon will appear in your toolbar

## Usage

### Check Current URL
1. Click the PhishShield icon in your toolbar
2. Click "Check Current URL"
3. View the risk assessment and details

### Analyze Email
1. Click "Email Check" tab
2. Paste suspicious email text
3. Click "Analyze Email"
4. Review the detection results

## How It Works

The extension communicates with the PhishShield backend API running on `http://localhost:4000` to:

- Analyze URLs for phishing indicators (IP addresses, HTTPS, domain age, etc.)
- Analyze email content for common phishing tactics (urgency, credential requests, etc.)
- Query WHOIS data for domain age and registration info
- Check against threat intelligence databases
- Apply ML-based confidence scoring
- Generate contextual alerts

## Requirements

- PhishShield backend running on `http://localhost:4000`
- ChromeDriver for Chrome or FirefoxDriver for Firefox
- Modern browser with Web Extensions support

## File Structure

```
browser-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Popup UI
├── popup.js          # Popup logic
├── background.js     # Service worker
├── content.js        # Content script for page injection
├── icons/            # Extension icons
└── README.md         # This file
```

## Tips

- Keep the backend API running for the extension to work
- The extension analyzes content locally and sends minimal data to the API
- Results are not stored in the extension; use the Dashboard for history
- For links on web pages, suspicious ones are highlighted automatically

## Troubleshooting

**"Failed to analyze"**: Make sure the backend API is running on `http://localhost:4000`

**Extension not loading**: Check manifest.json for syntax errors and ensure all files exist

**Links not highlighted**: Refresh the page after installing the extension

## Privacy

- The extension only sends the content you explicitly ask it to analyze
- All analysis is performed by the PhishShield backend
- No tracking or data collection beyond what's needed for analysis
