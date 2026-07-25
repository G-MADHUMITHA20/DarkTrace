import { useState, useEffect } from "react";
import { IconGlobe, IconAlertTriangle, IconActivity } from "./icons";

const MOCK_FEEDS = [
  { id: 1, name: "AlienVault OTX", status: "Connected", latency: "42ms", lastSync: "2 mins ago" },
  { id: 2, name: "Spamhaus DROP", status: "Connected", latency: "18ms", lastSync: "1 min ago" },
  { id: 3, name: "PhishTank", status: "Connected", latency: "65ms", lastSync: "5 mins ago" },
  { id: 4, name: "Abuse.ch URLhaus", status: "Syncing...", latency: "-", lastSync: "In progress" },
];

export default function ThreatIntelligence() {
  const [activeFeeds, setActiveFeeds] = useState(MOCK_FEEDS);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveFeeds(prev => prev.map(f => 
        f.name === "Abuse.ch URLhaus" 
          ? { ...f, status: "Connected", latency: "38ms", lastSync: "Just now" }
          : f
      ));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-wrapper" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="stat-cards-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1.25rem" }}>
        <div className="stat-card">
          <div className="stat-card-icon blue"><IconGlobe /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Active Threat Feeds</p>
            <p className="stat-card-value">4/4</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon red"><IconAlertTriangle /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Global Indicators (IoCs)</p>
            <p className="stat-card-value">2.4M</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green"><IconActivity /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Network Status</p>
            <p className="stat-card-value" style={{ fontSize: "1.2rem", marginTop: "0.25rem" }}>Optimal</p>
          </div>
        </div>
      </div>
      
      <div className="table-card">
        <div className="table-card-header">
          <p className="table-card-title">Connected Intelligence Feeds</p>
          <button className="table-filter-btn" onClick={() => window.location.reload()}>
            Sync All Feeds
          </button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Feed Name</th>
              <th>Connection Status</th>
              <th>Latency</th>
              <th style={{ textAlign: "right" }}>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {activeFeeds.map((feed) => (
              <tr key={feed.id}>
                <td style={{ fontWeight: 600, color: "var(--text)" }}>{feed.name}</td>
                <td>
                  <span className="status-badge" style={{ 
                    background: feed.status === "Connected" ? "var(--success-bg)" : "var(--warning-bg)",
                    color: feed.status === "Connected" ? "var(--success)" : "var(--warning)"
                  }}>
                    {feed.status}
                  </span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{feed.latency}</td>
                <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem" }}>{feed.lastSync}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
