// Service Worker for DarkTrace Extension

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('DarkTrace extension installed!');
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    analyzeContent(request.content, request.kind)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'goBack') {
    // Navigate the active tab back
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.goBack(tabs[0].id, () => {
          if (chrome.runtime.lastError) {
            // Fallback: navigate to new tab page if can't go back
            chrome.tabs.update(tabs[0].id, { url: 'chrome://newtab/' });
          }
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }
});

async function analyzeContent(content, kind) {
  try {
    const response = await fetch('http://localhost:4000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, content })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

// Listen for tab updates to check for phishing in real-time
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Auto-check URLs can be enabled here with user permission
    // checkURLForPhishing(tab.url);
  }
});
