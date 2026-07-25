import { useState } from "react";
import type { DetectionResult } from "./types";
import { IconSearch, IconX, IconCheck, IconAlertTriangle } from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function UrlScanner({ onStateUpdate }: { onStateUpdate: () => void }) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const analyzeNow = async () => {
    if (!inputText.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "url", content: inputText }),
      });
      if (!response.ok) throw new Error("Request failed");
      const nextResult = await response.json();
      setResult(nextResult);
      onStateUpdate();
    } catch {
      setError("Analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskTone = (res: DetectionResult | null) => {
    if (!res) return "neutral";
    if (res.classification === "Phishing") return "high";
    if (res.classification === "Suspicious") return "mid";
    return "low";
  };
  const riskTone = getRiskTone(result);

  return (
    <div className="scanner-page">
      <div className="scanner-left">
        <div className="analyzer-card">
          <h2 className="analyzer-card-title">Analyze URL</h2>
          <textarea
            className="scan-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste URL here (e.g. http://suspicious-site.com/login)..."
          />
          <div className="scan-actions">
            <button className="scan-btn" onClick={analyzeNow} disabled={analyzing || !inputText.trim()}>
              <IconSearch /> {analyzing ? "Analyzing..." : "Analyze"}
            </button>
            <button className="clear-btn" onClick={() => { setInputText(""); setResult(null); }}>
              <IconX /> Clear
            </button>
          </div>
          {error && <div className="error-banner" style={{ marginTop: "1rem" }}><IconAlertTriangle /> {error}</div>}
          {analyzing && (
            <div className="scan-progress">
              <div className="scan-progress-bar-track"><div className="scan-progress-bar" /></div>
              <p className="scan-progress-label">Running heuristics, WHOIS lookup &amp; ML classifier...</p>
            </div>
          )}
        </div>
      </div>

      <div className="scanner-right">
        {result && (
          <div className={`result-card ${riskTone}`}>
            <div className="result-card-header">
              <div className="result-card-header-left">
                <div className={`result-score-circle ${riskTone}`}>{result.riskScore}</div>
                <div>
                  <p className="result-meta-title">{result.riskLevel} Threat</p>
                  <p className="result-meta-sub">Final Risk Score: {result.riskScore}/100</p>
                </div>
              </div>
            </div>

            <div className="result-body">
              <div className="result-meta-grid">
                <div className="result-meta-item">
                  <span className="result-meta-key">ML Confidence</span>
                  <span className="result-meta-val">{result.mlConfidence ? Math.round(result.mlConfidence * 100) : 50}%</span>
                </div>
                <div className="result-meta-item">
                  <span className="result-meta-key">ML Score</span>
                  <span className="result-meta-val">{result.mlScore}/100</span>
                </div>
                <div className="result-meta-item">
                  <span className="result-meta-key">Heuristic Score</span>
                  <span className="result-meta-val">{result.heuristicScore}/100</span>
                </div>
                <div className="result-meta-item">
                  <span className="result-meta-key">Inference Time</span>
                  <span className="result-meta-val">{result.latencyMs} ms</span>
                </div>
              </div>

              <div className="result-split-layout">
                {result.explanation && result.explanation.length > 0 && (
                  <div className="result-split-col">
                    <p className="result-section-title">AI Explanation</p>
                    <div className="result-explanation card-compact">
                      {result.explanation.map((exp, i) => <p key={i}>{exp}</p>)}
                    </div>
                  </div>
                )}

                <div className="result-split-col">
                  <p className="result-section-title">Heuristic Breakdown</p>
                  <div className="heuristic-list card-compact">
                    {result.heuristicResults?.map((h) => (
                      <div key={h.id} className={`heuristic-item compact ${h.status}`}>
                        <div className="heuristic-header">
                          <span className="heuristic-status-icon compact">
                            {h.status === "pass" ? <IconCheck /> : h.status === "fail" ? <IconX /> : <IconAlertTriangle />}
                          </span>
                          <span className="heuristic-name">{h.name}</span>
                          {h.riskContribution > 0 && <span className="heuristic-risk">+{h.riskContribution} Risk</span>}
                        </div>
                        <p className="heuristic-desc">{h.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {!result && !analyzing && (
          <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <p style={{ fontWeight: 600, color: "#0F172A", marginBottom: "0.35rem" }}>No analysis yet</p>
            <p style={{ fontSize: "0.84rem", color: "#64748B" }}>Paste a URL on the left and click Analyze to see results here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
