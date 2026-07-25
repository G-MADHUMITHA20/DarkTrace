import { useEffect, useMemo, useState } from "react";
import type { AppState, BootstrapResponse, DetectionResult, InputKind, RiskLevel } from "./types";
import Dashboard from "./Dashboard";
import ExtensionCenter from "./ExtensionCenter";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getRiskLevelConfig(riskLevel: RiskLevel | string) {
  switch (riskLevel) {
    case "Critical":
      return { color: "#ff3b5c", bg: "rgba(255,59,92,0.12)", icon: "☠️", textClass: "risk-critical" };
    case "High Risk":
      return { color: "#ff5f7a", bg: "rgba(255,95,122,0.1)", icon: "🚨", textClass: "risk-high" };
    case "Medium Risk":
      return { color: "#ffbf4d", bg: "rgba(255,191,77,0.1)", icon: "⚠️", textClass: "risk-medium" };
    case "Low Risk":
      return { color: "#58c5ff", bg: "rgba(88,197,255,0.1)", icon: "🔍", textClass: "risk-low" };
    default:
      return { color: "#35e0b3", bg: "rgba(53,224,179,0.1)", icon: "✅", textClass: "risk-safe" };
  }
}

function RiskGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const config = getRiskLevelConfig(riskLevel);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="risk-gauge-wrap">
      <svg className="risk-gauge-svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(113,167,255,0.12)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${config.color})` }}
        />
        <text x="60" y="56" textAnchor="middle" fill="#ecf2ff" fontSize="20" fontWeight="800" fontFamily="Sora, sans-serif">
          {score}
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#9fb1d9" fontSize="9" fontFamily="Sora, sans-serif">
          / 100
        </text>
      </svg>
      <div className="risk-gauge-label" style={{ color: config.color }}>
        {config.icon} {riskLevel}
      </div>
    </div>
  );
}

const SECURITY_RECOMMENDATIONS: Record<string, string[]> = {
  Phishing: [
    "🚫 Do not click any links in this content.",
    "🔍 Verify the sender's identity through official channels.",
    "🔐 Enable Two-Factor Authentication on all accounts.",
    "📢 Report this to your IT/security team or mark as spam.",
    "🌐 Go directly to the official website — do not use provided links.",
    "🔑 Change your password if you already interacted with this content.",
  ],
  Suspicious: [
    "⚠️ Proceed with extreme caution before clicking any links.",
    "🔍 Verify the sender or domain through official channels.",
    "🔐 Enable Two-Factor Authentication as a safety measure.",
    "📢 Report if this seems like an impersonation attempt.",
    "🌐 Check the official website independently for verification.",
  ],
  Legitimate: [
    "✅ This appears safe, but always stay vigilant.",
    "🔐 Keep Two-Factor Authentication enabled for all accounts.",
    "🌐 Confirm the official domain before entering any credentials.",
  ],
};

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [inputKind, setInputKind] = useState<InputKind>("url");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState<"detector" | "dashboard" | "extension">("detector");

  const riskTone = useMemo(() => {
    if (!result) return "neutral";
    if (result.classification === "Phishing") return "high";
    if (result.classification === "Suspicious") return "mid";
    return "low";
  }, [result]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const response = await requestJson<BootstrapResponse>("/api/bootstrap");
        if (!mounted) return;
        setState(response.state);
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

    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
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

  if (loading) return <div className="status-screen"><div className="loading-pulse">Initializing DarkTrace...</div></div>;
  if (!state) return <div className="status-screen">No data from backend.</div>;

  const navTabs: Array<{ id: "detector" | "dashboard" | "extension"; label: string; icon: string }> = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "detector", label: "Detector", icon: "🔍" },
    { id: "extension", label: "Extension", icon: "🧩" },
  ];

  const recommendations = result ? SECURITY_RECOMMENDATIONS[result.classification] ?? SECURITY_RECOMMENDATIONS.Legitimate : [];

  return (
    <div className="app-shell">
      <div className="bg-orb orb-left" />
      <div className="bg-orb orb-right" />
      <div className="scanlines" />

      <nav className="top-nav">
        <div className="brand-wrap">
          <p className="brand-kicker">Threat Intelligence Platform</p>
          <h1 className="brand-title">
            <span className="brand-dark">Dark</span><span className="brand-trace">Trace</span>
          </h1>
        </div>
        <div className="nav-tabs">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              className={currentPage === tab.id ? "nav-tab active" : "nav-tab"}
              onClick={() => setCurrentPage(tab.id)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {currentPage === "dashboard" && <Dashboard />}
      {currentPage === "extension" && <ExtensionCenter />}

      {currentPage === "detector" && <main className="phishshield-shell">
        <header className="hero-card card">
          <p className="eyebrow">Real-Time Detection Core</p>
          <h2 className="hero-title">Analyze URLs & Emails with AI-Powered Threat Intelligence</h2>
          <p className="subtitle">Heuristics, WHOIS enrichment, threat intel, ML classifier and confidence scoring — all in real time.</p>
          <div className="hero-pills">
            <span>🔬 WHOIS</span>
            <span>🌐 Threat Intel</span>
            <span>🤖 ML Scoring</span>
            <span>⚡ Alert Pipeline</span>
            <span>🧠 AI Explanation</span>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card card">
            <p>Total Scans</p>
            <strong>{state.summary.totalScans}</strong>
          </article>
          <article className="stat-card card">
            <p>Phishing</p>
            <strong className="danger">{state.summary.phishingDetected}</strong>
          </article>
          <article className="stat-card card">
            <p>Suspicious</p>
            <strong className="warn">{state.summary.suspiciousDetected}</strong>
          </article>
          <article className="stat-card card">
            <p>Avg Inference</p>
            <strong>{state.summary.avgLatencyMs} ms</strong>
          </article>
        </section>

        <section className="main-grid">
          <article className="panel analyze-panel card">
            <div className="panel-head">
              <h2>Check Input</h2>
            </div>

            <div className="kind-tabs">
              {(["url", "email"] as InputKind[]).map((kind) => (
                <button
                  key={kind}
                  className={kind === inputKind ? "tab active" : "tab"}
                  onClick={() => setInputKind(kind)}
                >
                  {kind === "url" ? "🔗 URL" : "📧 Email"}
                </button>
              ))}
            </div>

            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder={
                inputKind === "url"
                  ? "Paste URL here (e.g. http://suspicious-site.com/login)..."
                  : "Paste suspicious email text here..."
              }
            />

            <div className="actions-row">
              <button className="primary-btn" onClick={analyzeNow} disabled={analyzing || !inputText.trim()}>
                {analyzing ? "⏳ Analyzing..." : "🔍 Analyze"}
              </button>
              <button className="ghost-btn" onClick={() => { setInputText(""); setResult(null); }}>Clear</button>
            </div>

            {analyzing && (
              <div className="analyze-progress">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" />
                </div>
                <p className="progress-label">Running heuristics, WHOIS lookup & ML classifier...</p>
              </div>
            )}

            {result && (
              <div className={`analysis-card ${riskTone}`}>
                {/* Risk Score Header */}
                <div className="risk-header">
                  <RiskGauge score={result.riskScore} riskLevel={result.riskLevel ?? "Safe"} />
                  <div className="risk-meta">
                    <div className="risk-meta-row">
                      <span className="risk-meta-label">Classification</span>
                      <span className={`label-tag classification-${result.classification.toLowerCase()}`}>
                        {result.classification}
                      </span>
                    </div>
                    <div className="risk-meta-row">
                      <span className="risk-meta-label">ML Confidence</span>
                      <span className="confidence-badge">
                        {result.mlConfidence ? Math.round(result.mlConfidence * 100) : 50}%
                      </span>
                    </div>
                    <div className="risk-meta-row">
                      <span className="risk-meta-label">Inference Time</span>
                      <span className="latency-badge">{result.latencyMs} ms</span>
                    </div>
                    <div className="risk-meta-row">
                      <span className="risk-meta-label">Scan Type</span>
                      <span className="kind-badge">{result.kind.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Score Bar */}
                <div className="bar">
                  <span style={{ width: `${result.riskScore}%` }} />
                </div>

                {/* AI Explanation Panel */}
                {result.explanation && result.explanation.length > 0 && (
                  <div className="ai-explanation-panel">
                    <h3 className="panel-section-title">🧠 AI Explanation</h3>
                    <ul className="ai-explanation-list">
                      {result.explanation.map((exp, i) => (
                        <li key={i} className="ai-explanation-item">{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detected Features & Reasons */}
                <div className="split">
                  <div>
                    <h3>🔬 Detected Features</h3>
                    <ul>
                      {result.features.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>🚩 Why It Was Flagged</h3>
                    <ul>
                      {result.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* WHOIS & Threat Intel */}
                {(result.whoisData || result.threatIntelData) && (
                  <div className="intel-row">
                    {result.whoisData && (
                      <div className="intel-chip">
                        <span className="intel-label">🕰️ Domain Age</span>
                        <span className="intel-value">{result.whoisData.age_days ?? "Unknown"} days</span>
                      </div>
                    )}
                    {result.threatIntelData && (
                      <div className="intel-chip">
                        <span className="intel-label">🛡️ Threat Score</span>
                        <span className="intel-value">{result.threatIntelData.overallThreatScore.toFixed(0)}/100</span>
                      </div>
                    )}
                    {result.threatIntelData?.isKnownMalicious && (
                      <div className="intel-chip danger-chip">
                        <span>⚠️ Known Malicious Domain</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Recommendations */}
                <div className="security-recommendations">
                  <h3 className="panel-section-title">🛡️ Security Recommendations</h3>
                  <ul className="recommendations-list">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="recommendation-item">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="panel feed-panel card">
          <div className="panel-head">
            <h2>Recent Checks</h2>
          </div>
          <div className="feed-list">
            {state.recentResults.map((record) => {
              const cfg = getRiskLevelConfig(record.riskLevel ?? "Safe");
              return (
                <article key={record.id} className="feed-item">
                  <div>
                    <p className="feed-title">{record.kind.toUpperCase()} scan</p>
                    <p className="feed-preview">{record.input}</p>
                    <p className="feed-date">{new Date(record.processedAt).toLocaleString()}</p>
                  </div>
                  <div className="feed-meta">
                    <strong style={{ color: cfg.color }}>{record.riskScore}</strong>
                    <span className="feed-risk-badge" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                      {cfg.icon} {record.riskLevel ?? record.classification}
                    </span>
                    <small>{record.latencyMs} ms</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {error && <div className="error-banner">{error}</div>}
      </main>}
    </div>
  );
}

export default App;
