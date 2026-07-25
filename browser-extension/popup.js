const API_BASE = 'http://localhost:4000';
let sessionScans = 0;

// Security recommendations by classification
const RECOMMENDATIONS = {
  Phishing: [
    '🚫 Do not click any links on this page.',
    '🔐 Change your password if you interacted.',
    '📢 Report this site to your security team.',
    '🌐 Visit the official site directly.',
  ],
  Suspicious: [
    '⚠️ Proceed with caution.',
    '🔍 Verify the site through official channels.',
    '🔐 Enable Two-Factor Authentication.',
    '🌐 Do not enter sensitive information.',
  ],
  Legitimate: [
    '✅ Looks safe — stay vigilant.',
    '🔐 Keep 2FA enabled on all accounts.',
  ],
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Get current URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlEl = document.getElementById('current-url');
  if (urlEl) urlEl.textContent = tab.url || 'N/A';

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

  // Clear previous results when switching
  clearResult();
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
  const warningBanner = document.getElementById('warning-banner');
  const resultCard = document.getElementById('result-card');

  const classification = result.classification;
  const riskScore = result.riskScore;
  const confidence = Math.round((result.mlConfidence || 0.5) * 100);
  const riskLevel = result.riskLevel || getRiskLevelFromScore(riskScore);
  const recommendations = RECOMMENDATIONS[classification] || RECOMMENDATIONS.Legitimate;

  // Show / hide warning banner for phishing
  if (classification === 'Phishing') {
    document.getElementById('warning-score').textContent = `${riskScore}/100`;
    document.getElementById('warning-confidence').textContent = `${confidence}%`;

    // Set short explanation from first AI explanation or fallback
    const firstExplanation = result.explanation && result.explanation.length > 0
      ? result.explanation[0].replace(/^[🔴🟡✅]\s*/, '')
      : 'Multiple phishing indicators detected by the AI classifier.';
    document.getElementById('warning-explanation').textContent = firstExplanation;

    warningBanner.classList.add('show');
  } else {
    warningBanner.classList.remove('show');
  }

  // Render main result card
  const riskClass = classification === 'Phishing' ? 'danger' : classification === 'Suspicious' ? 'suspicious' : 'safe';
  const riskEmoji = classification === 'Phishing' ? '☠️' : classification === 'Suspicious' ? '⚠️' : '✅';

  let html = `
    <div class="result-card ${riskClass}">
      <div class="result-heading">${riskEmoji} ${classification} — ${riskLevel}</div>
      <div class="result-row">
        <span class="result-label">Risk Score</span>
        <span class="result-value">${riskScore} / 100</span>
      </div>
      <div class="result-row">
        <span class="result-label">ML Confidence</span>
        <span class="result-value">${confidence}%</span>
      </div>
      <div class="result-row">
        <span class="result-label">Processing Time</span>
        <span class="result-value">${result.latencyMs}ms</span>
      </div>
  `;

  // AI Explanation (top 2 items)
  if (result.explanation && result.explanation.length > 0) {
    html += `<div class="result-row" style="flex-direction:column;align-items:flex-start;gap:0.3rem;padding-top:0.5rem;">
      <span class="result-label" style="margin-bottom:0.2rem;">🧠 AI Explanation</span>`;
    result.explanation.slice(0, 2).forEach(exp => {
      html += `<span style="font-size:0.74rem;color:#ecf2ff;line-height:1.4;">${exp.replace(/^[🔴🟡✅]\s*/, '')}</span>`;
    });
    html += `</div>`;
  }

  // Detected features (condensed)
  if (result.features && result.features.length > 0 && result.features[0] !== 'No strong phishing indicators found') {
    html += `<ul class="feature-list">`;
    result.features.slice(0, 4).forEach(f => {
      html += `<li>• ${f}</li>`;
    });
    html += `</ul>`;
  }

  // Domain / threat info
  if (result.whoisData) {
    html += `<div class="result-row">
      <span class="result-label">🕰️ Domain Age</span>
      <span class="result-value">${result.whoisData.age_days ?? 'Unknown'} days</span>
    </div>`;
  }
  if (result.threatIntelData) {
    html += `<div class="result-row">
      <span class="result-label">🛡️ Threat Score</span>
      <span class="result-value">${result.threatIntelData.overallThreatScore.toFixed(0)}/100</span>
    </div>`;
    if (result.threatIntelData.isKnownMalicious) {
      html += `<div class="result-row" style="color:#ff5f7a;font-weight:700;font-size:0.8rem;">⚠️ Known Malicious Domain</div>`;
    }
  }

  html += `</div>`;

  // Security recommendations
  html += `<div class="rec-panel">
    <div class="rec-title">🛡️ Recommendations</div>
    <ul class="rec-list">`;
  recommendations.forEach(rec => {
    html += `<li>${rec}</li>`;
  });
  html += `</ul></div>`;

  resultCard.innerHTML = html;
  resultEl.classList.add('show');
}

function getRiskLevelFromScore(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High Risk';
  if (score >= 35) return 'Medium Risk';
  if (score >= 15) return 'Low Risk';
  return 'Safe';
}

function goBack() {
  // Send message to background to navigate the active tab back
  chrome.runtime.sendMessage({ action: 'goBack' });
  // Also close the popup
  window.close();
}

function clearResult() {
  const resultEl = document.getElementById('result');
  const warningBanner = document.getElementById('warning-banner');
  const resultCard = document.getElementById('result-card');
  if (resultEl) resultEl.classList.remove('show');
  if (warningBanner) warningBanner.classList.remove('show');
  if (resultCard) resultCard.innerHTML = '';
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
