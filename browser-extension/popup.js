const API_BASE = 'http://localhost:4000';
let sessionScans = 0;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  document.getElementById('current-url').textContent = tab.url || 'N/A';

  // Load stats
  loadStats();
});

function switchTab(tab) {
  const urlSection = document.getElementById('url-section');
  const emailSection = document.getElementById('email-section');
  const tabs = document.querySelectorAll('.tab');

  if (tab === 'url') {
    urlSection.style.display = 'block';
    emailSection.style.display = 'none';
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else {
    urlSection.style.display = 'none';
    emailSection.style.display = 'block';
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
}

async function analyzeCurrentURL() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await analyzeURL(tab.url);
}

async function analyzeURL(url) {
  if (!url) {
    showError('No URL to analyze');
    return;
  }

  showLoading(true);
  showError('');
  clearResult();

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'url', content: url })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    displayResult(result);
    sessionScans++;
    updateSessionStats();
  } catch (error) {
    showError(`Failed to analyze URL: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

async function analyzeEmail() {
  const emailText = document.getElementById('email-input').value.trim();

  if (!emailText) {
    showError('Please enter email text to analyze');
    return;
  }

  showLoading(true);
  showError('');
  clearResult();

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'email', content: emailText })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    displayResult(result);
    sessionScans++;
    updateSessionStats();
  } catch (error) {
    showError(`Failed to analyze email: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

function displayResult(result) {
  const resultEl = document.getElementById('result');
  const classification = result.classification;
  const riskClass = classification === 'Phishing' ? 'danger' : classification === 'Suspicious' ? 'suspicious' : 'safe';

  const riskEmoji = classification === 'Phishing' ? '🚨' : classification === 'Suspicious' ? '⚠️' : '✅';

  let html = `
    <div class="${riskClass}">
      <h3>${riskEmoji} ${classification}</h3>
      <p><strong>Risk Score:</strong> ${result.riskScore}%</p>
      <p><strong>Confidence:</strong> ${Math.round((result.mlConfidence || 0.5) * 100)}%</p>
      <p><strong>Processing Time:</strong> ${result.latencyMs}ms</p>
  `;

  if (result.features && result.features.length > 0) {
    html += '<p><strong>Detected Features:</strong></p><ul>';
    result.features.forEach(f => {
      html += `<li>${f}</li>`;
    });
    html += '</ul>';
  }

  if (result.reasons && result.reasons.length > 0) {
    html += '<p><strong>Reasons:</strong></p><ul>';
    result.reasons.forEach(r => {
      html += `<li>${r}</li>`;
    });
    html += '</ul>';
  }

  if (result.whoisData) {
    html += `
      <p><strong>Domain Age:</strong> ${result.whoisData.age_days} days</p>
    `;
  }

  if (result.threatIntelData) {
    html += `
      <p><strong>Threat Score:</strong> ${result.threatIntelData.overallThreatScore.toFixed(0)}/100</p>
    `;
    if (result.threatIntelData.isKnownMalicious) {
      html += '<p style="color: #dc2626; font-weight: bold;">⚠️ Known Malicious Domain</p>';
    }
  }

  html += '</div>';

  resultEl.innerHTML = html;
  resultEl.classList.add('show');
}

function clearResult() {
  document.getElementById('result').innerHTML = '';
  document.getElementById('result').classList.remove('show');
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
  }
}

function showError(msg) {
  const errorEl = document.getElementById('error');
  if (msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  } else {
    errorEl.classList.remove('show');
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/stats`);
    if (response.ok) {
      const stats = await response.json();
      document.getElementById('stat-total').textContent = stats.totalScans;
      document.getElementById('stats').style.display = 'grid';
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

function updateSessionStats() {
  document.getElementById('stat-session').textContent = sessionScans;
}
