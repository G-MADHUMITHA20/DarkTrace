import { useEffect, useState } from "react";
import type { DetectionResult } from "./types";
import { 
  IconSearch, IconFilter, IconDownload, IconEye, 
  IconChevronLeft, IconChevronRight, IconGlobe, IconMail,
  IconShieldAlert, IconX, IconCopy, IconShieldX, IconFlag
} from "./icons";

const API_BASE = "http://localhost:4000";

function getRiskLabel(classification: string): string {
  if (classification === "Phishing") return "Critical";
  if (classification === "Suspicious") return "High Risk";
  return "Safe";
}

function getStatusClass(classification: string) {
  if (classification === "Phishing") return "critical";
  if (classification === "Suspicious") return "high-risk";
  return "safe";
}

function getScoreClass(score: number) {
  if (score >= 80) return "critical";
  if (score >= 60) return "danger";
  if (score >= 35) return "warning";
  return "success";
}

function DetailPanel({ result, onClose }: { result: DetectionResult; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "domain">("overview");
  const sc = getStatusClass(result.classification);
  const label = getRiskLabel(result.classification);

  const mlScore = result.mlScore;
  const heuristicScore = result.heuristicScore;

  function getScoreBarColor(s: number) {
    if (s >= 80) return "#DC2626";
    if (s >= 60) return "#EA580C";
    if (s >= 35) return "#D97706";
    return "#16A34A";
  }

  const recommendations: Record<string, string[]> = {
    Phishing: ["Do not click this link", "Verify the sender or domain", "Report this URL", "Enable Two-Factor Authentication"],
    Suspicious: ["Proceed with caution", "Verify sender through official channels", "Report if impersonation suspected"],
    Legitimate: ["Content appears safe — stay vigilant", "Confirm official domain before entering credentials"],
  };
  const recs = recommendations[result.classification] ?? recommendations.Legitimate;

  const recColors: Record<string, string> = {
    "Do not click this link": "#DC2626",
    "Verify the sender or domain": "#D97706",
    "Verify sender through official channels": "#D97706",
    "Report this URL": "#2563EB",
    "Report if impersonation suspected": "#2563EB",
    "Enable Two-Factor Authentication": "#16A34A",
    "Proceed with caution": "#D97706",
    "Content appears safe — stay vigilant": "#16A34A",
    "Confirm official domain before entering credentials": "#16A34A",
  };

  return (
    <>
      <div className="detail-panel-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-panel-header">
          <div className="detail-panel-title-row">
            <div className={`detail-panel-severity-icon ${sc}`}>
              <IconShieldAlert />
            </div>
            <div>
              <p className="detail-panel-title">{label === "Safe" ? "Safe Content" : `${label} Threat`}</p>
              <p className="detail-panel-score">Risk Score <strong>{result.riskScore}</strong>/100</p>
            </div>
          </div>
          <button className="detail-panel-close" onClick={onClose}><IconX /></button>
        </div>

        <div className="detail-panel-body">
          {/* Target */}
          <div className="detail-section">
            <p className="detail-section-title">Target</p>
            <div className="detail-target-url">
              <span>{result.input}</span>
              <button className="detail-copy-btn" onClick={() => navigator.clipboard.writeText(result.input)} title="Copy">
                <IconCopy />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="detail-tabs">
            {(["overview", "analysis", "domain"] as const).map((t) => (
              <button
                key={t}
                className={`detail-tab${activeTab === t ? " active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              {/* Scores */}
              <div className="detail-section">
                <p className="detail-section-title">Scores</p>
                <div className="score-row">
                  <div className="score-item">
                    <div className="score-item-header">
                      <span className="score-item-label">ML Score</span>
                      <span className="score-item-value">{mlScore}/100</span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar" style={{ width: `${mlScore}%`, background: getScoreBarColor(mlScore) }} />
                    </div>
                  </div>
                  <div className="score-item">
                    <div className="score-item-header">
                      <span className="score-item-label">Heuristic Score</span>
                      <span className="score-item-value">{heuristicScore}/100</span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar" style={{ width: `${heuristicScore}%`, background: getScoreBarColor(heuristicScore) }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Threat Explanation */}
              <div className="detail-section">
                <p className="detail-section-title">Threat Explanation</p>
                <div className="detail-explanation">
                  {result.explanation && result.explanation.length > 0
                    ? result.explanation.join(" ")
                    : result.reasons.join(". ") + "."}
                </div>
              </div>

              {/* Security Recommendations */}
              <div className="detail-section">
                <p className="detail-section-title">Security Recommendations</p>
                <div className="detail-list">
                  {recs.map((rec, i) => (
                    <div key={i} className="detail-list-item">
                      <span className="detail-list-dot" style={{ background: recColors[rec] ?? "#64748B" }} />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "analysis" && (
            <>
              <div className="detail-section">
                <p className="detail-section-title">Heuristic Breakdown</p>
                <div className="detail-list">
                  {result.heuristicResults?.map((h, i) => (
                    <div key={i} className="detail-list-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem", padding: "0.5rem", background: "var(--bg)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, color: h.status === "fail" ? "#DC2626" : h.status === "warning" ? "#D97706" : "#16A34A" }}>
                          {h.name}
                        </span>
                        {h.riskContribution > 0 && <span style={{ fontSize: "0.75rem", color: "#64748B" }}>+{h.riskContribution}</span>}
                      </div>
                      <span style={{ fontSize: "0.85rem", color: "#475569" }}>{h.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <p className="detail-section-title">Scan Metadata</p>
                <div>
                  <div className="detail-kv-row">
                    <span className="detail-kv-key">Classification</span>
                    <span className="detail-kv-val">{result.classification}</span>
                  </div>
                  <div className="detail-kv-row">
                    <span className="detail-kv-key">ML Confidence</span>
                    <span className="detail-kv-val">{result.mlConfidence ? Math.round(result.mlConfidence * 100) : 50}%</span>
                  </div>
                  <div className="detail-kv-row">
                    <span className="detail-kv-key">Inference Time</span>
                    <span className="detail-kv-val">{result.latencyMs} ms</span>
                  </div>
                  <div className="detail-kv-row">
                    <span className="detail-kv-key">Scan Type</span>
                    <span className="detail-kv-val">{result.kind.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "domain" && (
            <>
              {result.whoisData ? (
                <div className="detail-section">
                  <p className="detail-section-title">Domain Information</p>
                  <div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Domain</span>
                      <span className="detail-kv-val">{result.whoisData.domain}</span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Registrant</span>
                      <span className="detail-kv-val">{result.whoisData.registrant || "Unknown"}</span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Created</span>
                      <span className="detail-kv-val">{result.whoisData.creationDate ? new Date(result.whoisData.creationDate).toLocaleDateString() : "Unknown"}</span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Expires</span>
                      <span className="detail-kv-val">{result.whoisData.expirationDate ? new Date(result.whoisData.expirationDate).toLocaleDateString() : "Unknown"}</span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Domain Age</span>
                      <span className="detail-kv-val">{result.whoisData.age_days ?? "Unknown"} days</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <p className="detail-section-title">Domain Information</p>
                  <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>No WHOIS data available for this scan.</p>
                </div>
              )}
              {result.threatIntelData && (
                <div className="detail-section">
                  <p className="detail-section-title">Threat Intelligence</p>
                  <div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Threat Score</span>
                      <span className="detail-kv-val">{result.threatIntelData.overallThreatScore.toFixed(0)}/100</span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Known Malicious</span>
                      <span className="detail-kv-val" style={{ color: result.threatIntelData.isKnownMalicious ? "#DC2626" : "#16A34A" }}>
                        {result.threatIntelData.isKnownMalicious ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="detail-kv-row">
                      <span className="detail-kv-key">Abuse Reports</span>
                      <span className="detail-kv-val">{result.threatIntelData.abuseReports}</span>
                    </div>
                    {result.threatIntelData.threatTypes.length > 0 && (
                      <div className="detail-kv-row">
                        <span className="detail-kv-key">Threat Types</span>
                        <span className="detail-kv-val">{result.threatIntelData.threatTypes.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="detail-panel-footer">
          <button className="block-btn">
            <IconShieldX /> Block &amp; Warn User
          </button>
          <button className="report-btn">
            <IconFlag /> Report Threat
          </button>
        </div>
      </div>
    </>
  );
}

export default function History() {
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<DetectionResult | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchHistoryData();
  }, []);

  async function fetchHistoryData() {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/history?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    setPage(1);
    if (!q.trim()) {
      fetchHistoryData();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/history/search?q=${encodeURIComponent(q)}&limit=200`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      setResults((prev) => prev.filter((r) => r.input.toLowerCase().includes(q.toLowerCase())));
    }
  }

  function exportCSV() {
    const rows = [
      ["URL/Email", "Type", "Risk Score", "Status", "Classification", "Detected At"],
      ...results.map((r) => [r.input, r.kind.toUpperCase(), String(r.riskScore), getRiskLabel(r.classification), r.classification, new Date(r.processedAt).toLocaleString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "darktrace-history.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "#64748B" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem" }}>Loading history...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="table-card" style={{ height: "calc(100vh - 120px)" }}>
      <div className="table-card-header">
        <p className="table-card-title">Detection History</p>
        <div className="table-card-actions">
          <div className="table-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search URL or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="table-filter-btn">
            <IconFilter /> Filter
          </button>
          <button className="export-btn" onClick={exportCSV}>
            <IconDownload /> Export CSV
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <IconEye />
          <p>No scans found{searchQuery ? ` matching "${searchQuery}"` : ""}.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", flexGrow: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>URL / Email</th>
                  <th>Type</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Detected At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((r) => (
                  <tr key={r.id}>
                    <td className="table-url-cell">
                      <span className="table-url-text" title={r.input}>{r.input}</span>
                    </td>
                    <td>
                      <span className="table-type-badge">
                        {r.kind === "url" ? <IconGlobe /> : <IconMail />}
                        {r.kind.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreClass(r.riskScore)}`}>{r.riskScore}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(r.classification)}`}>
                        {getRiskLabel(r.classification)}
                      </span>
                    </td>
                    <td className="table-date-cell">{new Date(r.processedAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="table-action-btn"
                        title="View details"
                        onClick={() => setSelectedResult(r)}
                      >
                        <IconEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <p className="table-footer-info">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results.length)} of {results.length} results
            </p>
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <IconChevronLeft />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                 let p = i + 1;
                 if (totalPages > 5 && page > 3) p = page - 2 + i;
                 return (
                  <button
                    key={p}
                    className={`page-btn${p === page ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
      {selectedResult && (
        <DetailPanel result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  );
}
