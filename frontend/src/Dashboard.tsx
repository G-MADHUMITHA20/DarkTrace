import { useEffect, useState } from "react";
import type { DetectionResult, Alert, SummaryStats, RiskLevel } from "./types";

const API_BASE = "http://localhost:4000";

function getRiskLevelConfig(riskLevel: RiskLevel | string | undefined) {
  switch (riskLevel) {
    case "Critical":
      return { color: "#ff3b5c", icon: "☠️" };
    case "High Risk":
      return { color: "#ff5f7a", icon: "🚨" };
    case "Medium Risk":
      return { color: "#ffbf4d", icon: "⚠️" };
    case "Low Risk":
      return { color: "#58c5ff", icon: "🔍" };
    default:
      return { color: "#35e0b3", icon: "✅" };
  }
}

function getRiskColor(score: number): string {
  if (score >= 80) return "#ff3b5c";
  if (score >= 60) return "#ff5f7a";
  if (score >= 35) return "#ffbf4d";
  if (score >= 15) return "#58c5ff";
  return "#35e0b3";
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "#ff3b5c";
    case "HIGH": return "#ff5f7a";
    case "MEDIUM": return "#ffbf4d";
    default: return "#35e0b3";
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "alerts" | "stats">("stats");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsRes, historyRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/stats`),
        fetch(`${API_BASE}/api/dashboard/history?limit=100`),
        fetch(`${API_BASE}/api/dashboard/alerts?limit=50`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (historyRes.ok) {
        const data = await historyRes.json();
        setResults(data.results);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      // Reload all
      const res = await fetch(`${API_BASE}/api/dashboard/history?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/history/search?q=${encodeURIComponent(q)}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // fallback: client-side filter
      const filtered = results.filter(r => r.input.toLowerCase().includes(q.toLowerCase()));
      setResults(filtered);
    }
  }

  if (loading) {
    return (
      <div className="status-screen">
        <div className="loading-pulse">Loading dashboard...</div>
      </div>
    );
  }

  const safeCount = stats?.safeCount ?? 0;
  const maliciousCount = stats?.phishingDetected ?? 0;
  const totalScans = stats?.totalScans ?? 0;
  const avgRiskScore = stats?.avgRiskScore ?? 0;
  const detectionAccuracy = stats?.detectionAccuracy ?? 0;

  return (
    <section className="dashboard-shell">
      <header className="card dashboard-hero">
        <p className="eyebrow">Security Operations Center</p>
        <h2>DarkTrace Threat Dashboard</h2>
        <p className="subcopy">Live telemetry — detection performance, threat distribution, scan history, and active alerts.</p>
      </header>

      {/* 5 Enhanced Stat Cards */}
      <div className="dashboard-stats dashboard-stats-5">
        <article className="card dashboard-stat">
          <div className="stat-icon">📊</div>
          <p>Total Scanned</p>
          <strong>{totalScans}</strong>
          <span className="stat-sub">All-time scans</span>
        </article>
        <article className="card dashboard-stat stat-safe">
          <div className="stat-icon">✅</div>
          <p>Safe URLs</p>
          <strong className="ok">{safeCount}</strong>
          <span className="stat-sub">{totalScans > 0 ? Math.round((safeCount / totalScans) * 100) : 0}% of total</span>
        </article>
        <article className="card dashboard-stat stat-danger">
          <div className="stat-icon">🚨</div>
          <p>Malicious</p>
          <strong className="danger">{maliciousCount}</strong>
          <span className="stat-sub">{totalScans > 0 ? Math.round((maliciousCount / totalScans) * 100) : 0}% phishing rate</span>
        </article>
        <article className="card dashboard-stat">
          <div className="stat-icon">🎯</div>
          <p>Detection Accuracy</p>
          <strong className="cyan">{detectionAccuracy}%</strong>
          <span className="stat-sub">ML classifier</span>
        </article>
        <article className="card dashboard-stat stat-warn">
          <div className="stat-icon">📈</div>
          <p>Avg Risk Score</p>
          <strong className={avgRiskScore >= 60 ? "danger" : avgRiskScore >= 35 ? "warn" : "ok"}>{avgRiskScore}</strong>
          <span className="stat-sub">out of 100</span>
        </article>
      </div>

      {/* Tab bar */}
      <div className="card dashboard-tabs">
        {(["stats", "history", "alerts"] as const).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "dash-tab active" : "dash-tab"}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "stats" ? "📉 Stats" : tab === "history" ? "🕓 History" : "🔔 Alerts"}
          </button>
        ))}
      </div>

      {/* History Tab */}
      {activeTab === "history" && (
        <section className="card dash-panel">
          <div className="history-header">
            <h2>Scan History</h2>
            <div className="history-search-wrap">
              <input
                type="text"
                className="history-search"
                placeholder="🔍 Search URL or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {results.length === 0 ? (
            <p className="muted empty-state">No scans found{searchQuery ? ` matching "${searchQuery}"` : ""}.</p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>URL / Email</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Classification</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const cfg = getRiskLevelConfig(result.riskLevel);
                    return (
                      <tr key={result.id} className="history-row">
                        <td>
                          <span className="kind-badge-sm">{result.kind.toUpperCase()}</span>
                        </td>
                        <td className="history-input-cell" title={result.input}>
                          {result.input.length > 55 ? result.input.slice(0, 55) + "..." : result.input}
                        </td>
                        <td>
                          <span className="score-cell" style={{ color: getRiskColor(result.riskScore) }}>
                            {result.riskScore}
                          </span>
                        </td>
                        <td>
                          <span className="risk-level-badge" style={{ color: cfg.color, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}>
                            {cfg.icon} {result.riskLevel ?? "Safe"}
                          </span>
                        </td>
                        <td>
                          <span className={`classification-pill classification-${result.classification.toLowerCase()}`}>
                            {result.classification}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(result.processedAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <section className="card dash-panel">
          <h2>Active Alerts</h2>
          {alerts.length === 0 ? (
            <p className="muted empty-state">No alerts yet — system is clean. ✅</p>
          ) : (
            alerts.map((alert) => (
              <article key={alert.id} className="dash-item" style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
                <div className="dash-item-top">
                  <span className="dash-risk-pill" style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                    {alert.severity}
                  </span>
                  <span className="dash-item-kind">{alert.alertType}</span>
                </div>
                <p className="dash-item-input">{alert.message}</p>
                <small className="muted">
                  {new Date(alert.createdAt).toLocaleString()}
                </small>
              </article>
            ))
          )}
        </section>
      )}

      {/* Stats / Distribution Tab */}
      {activeTab === "stats" && stats && (
        <section className="card dash-panel">
          <h3>Threat Distribution</h3>
          <div className="threat-chart">
            <div className="threat-bar-row">
              <span className="threat-bar-label">☠️ Phishing</span>
              <div className="threat-bar-track">
                <div
                  className="threat-bar"
                  style={{ width: `${(stats.phishingDetected / (totalScans || 1)) * 100}%`, backgroundColor: "#ff3b5c" }}
                />
              </div>
              <span className="threat-bar-count">{stats.phishingDetected}</span>
            </div>
            <div className="threat-bar-row">
              <span className="threat-bar-label">⚠️ Suspicious</span>
              <div className="threat-bar-track">
                <div
                  className="threat-bar"
                  style={{ width: `${(stats.suspiciousDetected / (totalScans || 1)) * 100}%`, backgroundColor: "#ffbf4d" }}
                />
              </div>
              <span className="threat-bar-count">{stats.suspiciousDetected}</span>
            </div>
            <div className="threat-bar-row">
              <span className="threat-bar-label">✅ Safe</span>
              <div className="threat-bar-track">
                <div
                  className="threat-bar"
                  style={{ width: `${(safeCount / (totalScans || 1)) * 100}%`, backgroundColor: "#35e0b3" }}
                />
              </div>
              <span className="threat-bar-count">{safeCount}</span>
            </div>
          </div>

          <div className="stats-summary-grid">
            <div className="stats-summary-item">
              <span className="stats-summary-label">Avg Latency</span>
              <span className="stats-summary-value">{stats.avgLatencyMs}ms</span>
            </div>
            <div className="stats-summary-item">
              <span className="stats-summary-label">Avg Risk Score</span>
              <span className="stats-summary-value" style={{ color: getRiskColor(avgRiskScore) }}>{avgRiskScore}/100</span>
            </div>
            <div className="stats-summary-item">
              <span className="stats-summary-label">Detection Accuracy</span>
              <span className="stats-summary-value" style={{ color: "#35e0b3" }}>{detectionAccuracy}%</span>
            </div>
            <div className="stats-summary-item">
              <span className="stats-summary-label">Total Alerts</span>
              <span className="stats-summary-value">{alerts.length}</span>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
