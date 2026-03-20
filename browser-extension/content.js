// Content script for PhishShield Extension
// This runs in the context of web pages

console.log('PhishShield content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeEmail') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: 'analyze',
        content: selectedText,
        kind: 'email'
      }, sendResponse);
      return true;
    }
  }
});

// Add context menu listeners
document.addEventListener('contextmenu', (e) => {
  const selectedText = window.getSelection().toString();
  if (selectedText && selectedText.length > 5) {
    // Store selected text for right-click menu if implemented
    chrome.storage.local.set({ selectedText });
  }
});

// Monitor for suspicious links and highlight them
function highlightSuspiciousLinks() {
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const url = link.getAttribute('href');
    if (isSuspiciousURL(url)) {
      link.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      link.style.borderBottom = '2px solid red';
      link.title = 'This link may be suspicious';
    }
  });
}

function isSuspiciousURL(url) {
  // Basic heuristics for suspicious URLs
  if (!url || url.startsWith('javascript:')) return false;
  
  try {
    const urlObj = new URL(url, window.location.href);
    const hostname = urlObj.hostname;
    
    // Check for IP addresses
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    
    // Check for excessive subdomains
    if (hostname.split('.').length > 4) return true;
    
    // Check for suspicious ports
    if (urlObj.port && ![80, 443, '80', '443'].includes(urlObj.port)) return true;
    
    // Check for http (not https)
    if (urlObj.protocol === 'http:' && !hostname.includes('localhost')) return true;
    
    return false;
  } catch {
    return false;
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightSuspiciousLinks);
} else {
  highlightSuspiciousLinks();
}

// Run after a delay to catch dynamically added content
setTimeout(highlightSuspiciousLinks, 2000);
