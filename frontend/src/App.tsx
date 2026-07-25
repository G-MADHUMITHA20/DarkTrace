import { useEffect, useMemo, useState } from "react";
import type { AppState, BootstrapResponse, DetectionResult, InputKind } from "./types";
import Dashboard from "./Dashboard";
import ExtensionCenter from "./ExtensionCenter";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

type PageId = "dashboard" | "detector" | "extension";

function getRiskTone(result: DetectionResult | null) {
  if (!result) return "neutral";
  if (result.classification === "Phishing") return "high";
  if (result.classification === "Suspicious") return "mid";
  return "low";
}

function getRiskLabel(classification: string): string {
  if (classification === "Phishing") return "Critical";
  if (classification === "Suspicious") return "Warning";
  return "Safe";
}

function getStatusClass(classification: string) {
  if (classification === "Phishing") return "critical";
  if (classification === "Suspicious") return "warning";
  return "safe";
}

function getScoreClass(score: number) {
  if (score >= 80) return "critical";
  if (score >= 60) return "danger";
  if (score >= 35) return "warning";
  return "success";
}

const SECURITY_RECOMMENDATIONS: Record<string, string[]> = {
  Phishing: [
    "Do not click any links in this content.",
    "Verify the sender's identity through official channels.",
    "Enable Two-Factor Authentication on all accounts.",
    "Report this to your IT/security team or mark as spam.",
    "Navigate directly to the official website — do not use provided links.",
    "Change your password if you already interacted with this content.",
  ],
  Suspicious: [
    "Proceed with extreme caution before clicking any links.",
    "Verify the sender or domain through official channels.",
    "Enable Two-Factor Authentication as a safety measure.",
    "Report if this seems like an impersonation attempt.",
    "Check the official website independently for verification.",
  ],
  Legitimate: [
    "This appears safe, but always stay vigilant.",
    "Keep Two-Factor Authentication enabled for all accounts.",
    "Confirm the official domain before entering any credentials.",
  ],
};

/* ---- SVG Icons ---- */
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconAlertTriangle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your security posture and threat activity" },
  detector: { title: "URL & Email Scanner", subtitle: "Analyze URLs and emails with AI-powered threat intelligence" },
  extension: { title: "Extension Center", subtitle: "Browser security module installation and management" },
};

const NAV_ITEMS: Array<{ id: PageId; label: string; icon: JSX.Element; section?: string }> = [
  { id: "dashboard", label: "Dashboard", icon: <IconGrid />, section: "MAIN" },
  { id: "detector", label: "URL Scanner", icon: <IconGlobe />, section: "MAIN" },
  { id: "detector", label: "Email Scanner", icon: <IconMail /> },
  { id: "dashboard", label: "Detection History", icon: <IconClock /> },
  { id: "dashboard", label: "Threat Intelligence", icon: <IconAlertTriangle /> },
  { id: "dashboard", label: "Reports", icon: <IconBarChart />, section: "SYSTEM" },
  { id: "extension", label: "Settings", icon: <IconSettings /> },
];

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [inputKind, setInputKind] = useState<InputKind>("url");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [activeNavLabel, setActiveNavLabel] = useState("Dashboard");

  const riskTone = useMemo(() => getRiskTone(result), [result]);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const response = await requestJson<BootstrapResponse>("/api/bootstrap");
        if (mounted) setState(response.state);
      } catch {
        if (mounted) setError("Unable to connect to backend API.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    bootstrap();
    const poll = window.setInterval(async () => {
      try {
        const latest = await requestJson<AppState>("/api/state");
        if (mounted) setState(latest);
      } catch {
        if (mounted) setError("Backend polling failed.");
      }
    }, 2400);
    return () => { mounted = false; window.clearInterval(poll); };
  }, []);

  const analyzeNow = async () => {
    if (!inputText.trim()) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const nextResult = await requestJson<DetectionResult>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ kind: inputKind, content: inputText }),
      });
      setResult(nextResult);
      const latest = await requestJson<AppState>("/api/state");
      setState(latest);
      setError("");
    } catch {
      setError("Analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="status-screen">
        <div className="loading-box">
          <div className="loading-spinner" />
          <p className="loading-text">Initializing DarkTrace...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="status-screen">
        <div className="loading-box">
          <IconAlertTriangle />
          <p className="loading-text">No data from backend.</p>
        </div>
      </div>
    );
  }

  const recommendations = result
    ? SECURITY_RECOMMENDATIONS[result.classification] ?? SECURITY_RECOMMENDATIONS.Legitimate
    : [];

  const { title, subtitle } = PAGE_TITLES[currentPage];

  return (
    <div className="app-shell">
      {/* ---- SIDEBAR ---- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconShield />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">DarkTrace</span>
            <span className="sidebar-logo-sub">Cybersecurity Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, idx) => (
            <div key={idx}>
              {item.section && (
                <p className="sidebar-section-label">{item.section}</p>
              )}
              <button
                className={`nav-item${currentPage === item.id && activeNavLabel === item.label ? " active" : ""}`}
                onClick={() => { setCurrentPage(item.id); setActiveNavLabel(item.label); }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">J</div>
          <div className="user-info">
            <p className="user-name">John Admin</p>
            <p className="user-role">Administrator</p>
          </div>
        </div>
      </aside>

      {/* ---- MAIN AREA ---- */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-title-group">
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-subtitle">{subtitle}</p>
          </div>

          <div className="topbar-search">
            <IconSearch />
            <input placeholder="Search anything..." />
          </div>

          <div className="topbar-actions">
            <button className="topbar-icon-btn" title="Notifications">
              <IconBell />
              {(state.summary.phishingDetected > 0) && <span className="notif-dot" />}
            </button>
            <button className="topbar-icon-btn" title="Theme Toggle">
              <IconMoon />
            </button>
            <div className="topbar-avatar" title="Profile">J</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "extension" && <ExtensionCenter />}

          {currentPage === "detector" && (
            <div className="scanner-page">
              {/* Left column */}
              <div className="scanner-left">
                {/* Stat cards */}
                <div className="scanner-stats">
                  <div className="scanner-stat-card">
                    <p className="scanner-stat-label">Total Scans</p>
                    <p className="scanner-stat-value">{state.summary.totalScans}</p>
                  </div>
                  <div className="scanner-stat-card">
                    <p className="scanner-stat-label">Threats Detected</p>
                    <p className="scanner-stat-value danger">{state.summary.phishingDetected}</p>
                  </div>
                  <div className="scanner-stat-card">
                    <p className="scanner-stat-label">Suspicious</p>
                    <p className="scanner-stat-value warning">{state.summary.suspiciousDetected}</p>
                  </div>
                  <div className="scanner-stat-card">
                    <p className="scanner-stat-label">Avg Inference</p>
                    <p className="scanner-stat-value">{state.summary.avgLatencyMs}<small style={{ fontSize: "0.9rem", fontWeight: 500 }}>ms</small></p>
                  </div>
                </div>

                {/* Analyzer */}
                <div className="analyzer-card">
                  <h2 className="analyzer-card-title">Analyze Input</h2>

                  <div className="type-tabs">
                    {(["url", "email"] as InputKind[]).map((kind) => (
                      <button
                        key={kind}
                        className={`type-tab${inputKind === kind ? " active" : ""}`}
                        onClick={() => setInputKind(kind)}
                      >
                        {kind === "url" ? <IconGlobe /> : <IconMail />}
                        {kind === "url" ? "URL" : "Email"}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="scan-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      inputKind === "url"
                        ? "Paste URL here (e.g. http://suspicious-site.com/login)..."
                        : "Paste suspicious email text here..."
                    }
                  />

                  <div className="scan-actions">
                    <button
                      className="scan-btn"
                      onClick={analyzeNow}
                      disabled={analyzing || !inputText.trim()}
                    >
                      <IconSearch />
                      {analyzing ? "Analyzing..." : "Analyze"}
                    </button>
                    <button
                      className="clear-btn"
                      onClick={() => { setInputText(""); setResult(null); }}
                    >
                      <IconX /> Clear
                    </button>
                  </div>

                  {analyzing && (
                    <div className="scan-progress">
                      <div className="scan-progress-bar-track">
                        <div className="scan-progress-bar" />
                      </div>
                      <p className="scan-progress-label">Running heuristics, WHOIS lookup &amp; ML classifier...</p>
                    </div>
                  )}
                </div>

                {/* Recent Checks Feed */}
                {state.recentResults.length > 0 && (
                  <div className="feed-card">
                    <div className="feed-card-header">
                      <h3 className="feed-card-title">Recent Checks</h3>
                    </div>
                    <div className="feed-list">
                      {state.recentResults.slice(0, 6).map((record) => {
                        const sc = getStatusClass(record.classification);
                        return (
                          <div key={record.id} className="feed-item">
                            <div className="feed-item-left">
                              <p className="feed-kind">{record.kind.toUpperCase()}</p>
                              <p className="feed-input">{record.input.length > 50 ? record.input.slice(0, 50) + "…" : record.input}</p>
                              <p className="feed-time">{new Date(record.processedAt).toLocaleString()}</p>
                            </div>
                            <div className="feed-item-right">
                              <span className={`status-badge ${sc}`}>
                                {getRiskLabel(record.classification)}
                              </span>
                              <span
                                className={`score-badge ${getScoreClass(record.riskScore)}`}
                              >
                                {record.riskScore}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column — Analysis Result */}
              <div>
                {result && (
                  <div className={`result-card ${riskTone}`}>
                    <div className="result-card-header">
                      <div className="result-card-header-left">
                        <div className={`result-score-circle ${riskTone}`}>
                          {result.riskScore}
                        </div>
                        <div>
                          <p className="result-meta-title">
                            {result.classification === "Phishing" ? "Critical Threat" : result.classification === "Suspicious" ? "Suspicious Activity" : "Legitimate Content"}
                          </p>
                          <p className="result-meta-sub">Risk Score: {result.riskScore}/100 · {result.kind.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`status-badge ${getStatusClass(result.classification)}`}>
                        {getRiskLabel(result.classification)}
                      </span>
                    </div>

                    <div className="result-body">
                      {/* Meta grid */}
                      <div className="result-meta-grid">
                        <div className="result-meta-item">
                          <span className="result-meta-key">Classification</span>
                          <span className="result-meta-val">{result.classification}</span>
                        </div>
                        <div className="result-meta-item">
                          <span className="result-meta-key">ML Confidence</span>
                          <span className="result-meta-val">
                            {result.mlConfidence ? Math.round(result.mlConfidence * 100) : 50}%
                          </span>
                        </div>
                        <div className="result-meta-item">
                          <span className="result-meta-key">Inference Time</span>
                          <span className="result-meta-val">{result.latencyMs} ms</span>
                        </div>
                        <div className="result-meta-item">
                          <span className="result-meta-key">Scan Type</span>
                          <span className="result-meta-val">{result.kind.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Risk bar */}
                      <div>
                        <div className="score-item-header" style={{ marginBottom: "6px" }}>
                          <span className="result-meta-key">Risk Score</span>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{result.riskScore}/100</span>
                        </div>
                        <div className="score-bar-track">
                          <div
                            className="score-bar"
                            style={{
                              width: `${result.riskScore}%`,
                              background: result.riskScore >= 80 ? "#DC2626" : result.riskScore >= 60 ? "#EA580C" : result.riskScore >= 35 ? "#D97706" : "#16A34A",
                            }}
                          />
                        </div>
                      </div>

                      {/* AI Explanation */}
                      {result.explanation && result.explanation.length > 0 && (
                        <div>
                          <p className="result-section-title">AI Explanation</p>
                          <ul className="result-explanation">
                            {result.explanation.map((exp, i) => (
                              <li key={i}>{exp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Features & Reasons */}
                      <div className="result-split">
                        <div className="result-split-col">
                          <h4>Detected Features</h4>
                          <ul>
                            {result.features.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="result-split-col">
                          <h4>Why Flagged</h4>
                          <ul>
                            {result.reasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* WHOIS & Intel */}
                      {(result.whoisData || result.threatIntelData) && (
                        <div>
                          <p className="result-section-title">Domain Intelligence</p>
                          <div className="result-intel-row">
                            {result.whoisData && (
                              <div className="intel-pill">
                                <span className="intel-pill-key">Domain Age</span>
                                <span className="intel-pill-val">{result.whoisData.age_days ?? "Unknown"} days</span>
                              </div>
                            )}
                            {result.threatIntelData && (
                              <div className="intel-pill">
                                <span className="intel-pill-key">Threat Score</span>
                                <span className="intel-pill-val">{result.threatIntelData.overallThreatScore.toFixed(0)}/100</span>
                              </div>
                            )}
                            {result.threatIntelData?.isKnownMalicious && (
                              <div className="intel-pill danger">
                                ⚠ Known Malicious Domain
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Security Recommendations */}
                      <div>
                        <p className="result-section-title">Security Recommendations</p>
                        <ul className="result-recs">
                          {recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {!result && !analyzing && (
                  <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                    <div style={{ color: "#94A3B8", marginBottom: "0.75rem" }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p style={{ fontWeight: 600, color: "#0F172A", marginBottom: "0.35rem" }}>No analysis yet</p>
                    <p style={{ fontSize: "0.84rem", color: "#64748B" }}>Paste a URL or email on the left and click Analyze to see results here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <IconAlertTriangle />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
