import { useEffect, useState } from "react";
import type { DetectionResult, Alert, SummaryStats } from "./types";

export default function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "alerts" | "stats">("stats");

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const [statsRes, historyRes, alertsRes] = await Promise.all([
        fetch("http://localhost:4000/api/dashboard/stats"),
        fetch("http://localhost:4000/api/dashboard/history?limit=100"),
        fetch("http://localhost:4000/api/dashboard/alerts?limit=50"),
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

  function getRiskColor(score: number): string {
    if (score >= 70) return "#dc2626"; // Phishing - Red
    if (score >= 35) return "#f59e0b"; // Suspicious - Amber
    return "#10b981"; // Legitimate - Green
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#f59e0b";
      case "MEDIUM":
        return "#3b82f6";
      default:
        return "#10b981";
    }
  }

  if (loading) {
    return (
      <div className="status-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <section className="dashboard-shell">
      <header className="card dashboard-hero">
        <p className="eyebrow">SOC Overview</p>
        <h2>Threat Operations Dashboard</h2>
        <p className="subcopy">Live telemetry for detection performance, incidents, and alerts.</p>
      </header>

      <div className="dashboard-stats">
        <article className="card dashboard-stat">
          <p>Total Scans</p>
          <strong>{stats?.totalScans ?? 0}</strong>
        </article>
        <article className="card dashboard-stat">
          <p>Phishing</p>
          <strong className="danger">{stats?.phishingDetected ?? 0}</strong>
        </article>
        <article className="card dashboard-stat">
          <p>Suspicious</p>
          <strong className="warn">{stats?.suspiciousDetected ?? 0}</strong>
        </article>
        <article className="card dashboard-stat">
          <p>Avg Latency</p>
          <strong>{stats?.avgLatencyMs ?? 0}ms</strong>
        </article>
      </div>

      <div className="card dashboard-tabs">
        {["stats", "history", "alerts"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "dash-tab active" : "dash-tab"}
            onClick={() => setActiveTab(tab as "history" | "alerts" | "stats")}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <section className="card dash-panel">
          <h2>Recent Scans</h2>
          {results.length === 0 ? (
            <p className="muted">No scans yet</p>
          ) : (
            results.map((result) => (
              <article key={result.id} className="dash-item" style={{ borderLeftColor: getRiskColor(result.riskScore) }}>
                <div className="dash-item-top">
                  <span className="dash-item-kind">{result.kind.toUpperCase()}</span>
                  <span className="dash-risk-pill" style={{ backgroundColor: getRiskColor(result.riskScore) }}>
                    {result.riskScore}% - {result.classification}
                  </span>
                </div>
                <p className="dash-item-input">{result.input}</p>
                <div className="dash-item-meta">
                    <span>{result.latencyMs}ms</span>
                    <span>{new Date(result.processedAt).toLocaleTimeString()}</span>
                    {result.mlConfidence && (
                      <span>ML: {(result.mlConfidence * 100).toFixed(0)}%</span>
                    )}
                </div>
                {result.whoisData && (
                  <div className="dash-item-details">
                    <strong>Domain Age:</strong> {result.whoisData.age_days} days
                  </div>
                )}
                {result.threatIntelData && (
                  <div className="dash-item-details">
                    <strong>Threat Score:</strong> {result.threatIntelData.overallThreatScore.toFixed(0)}
                    {result.threatIntelData.isKnownMalicious && (
                      <span className="danger" style={{ marginLeft: "0.5rem" }}>
                        ⚠️ Known Malicious
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      )}

      {activeTab === "alerts" && (
        <section className="card dash-panel">
          <h2>Active Alerts</h2>
          {alerts.length === 0 ? (
            <p className="muted">No alerts yet</p>
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

      {activeTab === "stats" && stats && (
        <section className="card dash-panel">
            <h3>Threat Distribution</h3>
            <div className="threat-chart">
              <div
                className="threat-bar"
                style={{ width: `${(stats.phishingDetected / stats.totalScans) * 100 || 0}%`, backgroundColor: "#dc2626" }}
              >
                Phishing ({stats.phishingDetected})
              </div>
              <div
                className="threat-bar"
                style={{ width: `${(stats.suspiciousDetected / stats.totalScans) * 100 || 0}%`, backgroundColor: "#f59e0b" }}
              >
                Suspicious ({stats.suspiciousDetected})
              </div>
              <div
                className="threat-bar"
                style={{ width: `${((stats.totalScans - stats.phishingDetected - stats.suspiciousDetected) / stats.totalScans) * 100 || 0}%`, backgroundColor: "#10b981" }}
              >
                Legitimate (
                {stats.totalScans - stats.phishingDetected - stats.suspiciousDetected})
              </div>
            </div>
        </section>
      )}
    </section>
  );
}
