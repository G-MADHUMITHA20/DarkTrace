import { useEffect, useMemo, useState } from "react";
import type { AppState, BootstrapResponse, DetectionResult, InputKind } from "./types";
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

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [inputKind, setInputKind] = useState<InputKind>("url");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
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
    }
  };

  if (loading) return <div className="status-screen">Loading PhishShield...</div>;
  if (!state) return <div className="status-screen">No data from backend.</div>;

  const navTabs: Array<{ id: "detector" | "dashboard" | "extension"; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "detector", label: "Detector" },
    { id: "extension", label: "Extension" },
  ];

  return (
    <div className="app-shell">
      <div className="bg-orb orb-left" />
      <div className="bg-orb orb-right" />
      <div className="scanlines" />

      <nav className="top-nav">
        <div className="brand-wrap">
          <p className="brand-kicker">Threat Intelligence Platform</p>
          <h1 className="brand-title">PhishShield</h1>
        </div>
        <div className="nav-tabs">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              className={currentPage === tab.id ? "nav-tab active" : "nav-tab"}
              onClick={() => setCurrentPage(tab.id)}
            >
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
        <h2 className="hero-title">Analyze URLs and Emails with Enriched Threat Signals</h2>
        <p className="subtitle">Feature extraction, WHOIS context, threat intel checks, and ML confidence scoring.</p>
        <div className="hero-pills">
          <span>WHOIS</span>
          <span>Threat Intel</span>
          <span>ML Risk Scoring</span>
          <span>Alert Pipeline</span>
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card card">
          <p>Total Scans</p>
          <strong>{state.summary.totalScans}</strong>
        </article>
        <article className="stat-card card">
          <p>Phishing Detected</p>
          <strong className="danger">{state.summary.phishingDetected}</strong>
        </article>
        <article className="stat-card card">
          <p>Suspicious Flagged</p>
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
                {kind.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={
              inputKind === "url"
                ? "Paste URL here..."
                : "Paste suspicious email text here..."
            }
          />

          <div className="actions-row">
            <button className="primary-btn" onClick={analyzeNow}>Analyze</button>
            <button className="ghost-btn" onClick={() => setInputText("")}>Clear</button>
          </div>

          {result && (
            <div className={`analysis-card ${riskTone}`}>
              <p>
                Risk Score <strong>{result.riskScore}</strong>
                <span className="label-tag">{result.classification}</span>
              </p>
              <p>Inference Time: {result.latencyMs} ms</p>
              <div className="bar">
                <span style={{ width: `${result.riskScore}%` }} />
              </div>
              <div className="split">
                <div>
                  <h3>Detected Features</h3>
                  <ul>
                    {result.features.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Why It Was Flagged</h3>
                  <ul>
                    {result.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
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
          {state.recentResults.map((record) => (
            <article key={record.id} className="feed-item">
              <div>
                <p className="feed-title">{record.kind.toUpperCase()} scan</p>
                <p className="feed-preview">{record.input}</p>
              </div>
              <div className="feed-meta">
                <strong>{record.riskScore}</strong>
                <span>{record.classification}</span>
                <small>{record.latencyMs} ms</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}
    </main>}
    </div>
  );
}

export default App;
