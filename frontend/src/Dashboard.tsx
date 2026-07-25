import { useEffect, useState } from "react";
import type { DetectionResult, Alert, SummaryStats } from "./types";

const API_BASE = "http://localhost:4000";

/* ---- Utility ---- */
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

function getSeverityClass(s: string) {
  if (s === "CRITICAL") return "critical";
  if (s === "HIGH") return "high-risk";
  if (s === "MEDIUM") return "warning";
  return "safe";
}

/* ---- SVG Icons ---- */
function IconScan() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
}
function IconShieldCheck() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function IconShieldAlert() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function IconAlertOctagon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function IconActivity() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconEye() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconGlobe() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function IconMail() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function IconChevronDown() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
}
function IconX() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconCopy() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function IconShieldX() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>;
}
function IconFlag() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
}
function IconFilter() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}
function IconDownload() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconSearch() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconChevronLeft() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IconChevronRight() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconTrendUp() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function IconTrendDown() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>;
}

/* ---- Inline SVG Line Chart ---- */
function LineTrendChart({ results }: { results: DetectionResult[] }) {
  const width = 520;
  const height = 160;
  const padX = 40;
  const padY = 20;

  // Group by day (last 7 days)
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now - (6 - i) * 86400000);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateStr: d.toISOString().slice(0, 10),
      malicious: 0,
      suspicious: 0,
      safe: 0,
    };
  });

  for (const r of results) {
    const day = r.processedAt.slice(0, 10);
    const found = days.find((d) => d.dateStr === day);
    if (found) {
      if (r.classification === "Phishing") found.malicious++;
      else if (r.classification === "Suspicious") found.suspicious++;
      else found.safe++;
    }
  }

  const maxVal = Math.max(...days.flatMap((d) => [d.malicious, d.suspicious, d.safe]), 5);

  function toX(i: number) {
    return padX + (i / (days.length - 1)) * (width - padX * 2);
  }
  function toY(val: number) {
    return padY + (1 - val / maxVal) * (height - padY * 2);
  }

  function makePath(key: "malicious" | "suspicious" | "safe") {
    return days.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(" ");
  }

  const lines = [
    { key: "malicious" as const, color: "#DC2626", label: "Malicious" },
    { key: "suspicious" as const, color: "#D97706", label: "Suspicious" },
    { key: "safe" as const, color: "#16A34A", label: "Safe" },
  ];

  // Y grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padY + (1 - pct) * (height - padY * 2),
    val: Math.round(pct * maxVal),
  }));

  return (
    <div className="line-chart-wrap">
      <div className="line-chart-legend">
        {lines.map((l) => (
          <span key={l.key} className="legend-item">
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        {/* Grid */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padX} y1={g.y} x2={width - padX} y2={g.y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padX - 6} y={g.y + 4} fontSize="9" fill="#94A3B8" textAnchor="end">{g.val}</text>
          </g>
        ))}
        {/* X labels */}
        {days.map((d, i) => (
          <text key={i} x={toX(i)} y={height - 2} fontSize="9" fill="#94A3B8" textAnchor="middle">
            {d.label}
          </text>
        ))}
        {/* Lines */}
        {lines.map((l) => (
          <g key={l.key}>
            <path d={makePath(l.key)} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {days.map((d, i) => (
              <circle key={i} cx={toX(i)} cy={toY(d[l.key])} r="3" fill={l.color} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---- SVG Donut Chart ---- */
function DonutChart({ phishing, suspicious, safe }: { phishing: number; suspicious: number; safe: number }) {
  const total = phishing + suspicious + safe || 1;
  const segments = [
    { label: "Safe", value: safe, color: "#16A34A" },
    { label: "Suspicious", value: suspicious, color: "#D97706" },
    { label: "High Risk", value: phishing * 0.7, color: "#DC2626" },
    { label: "Critical", value: phishing * 0.3, color: "#991B1B" },
  ];

  const cx = 70; const cy = 70; const r = 52; const hole = 34;
  const circumference = 2 * Math.PI * r;

  let cumPct = 0;
  const slices = segments.map((s) => {
    const pct = s.value / total;
    const offset = cumPct;
    cumPct += pct;
    return { ...s, pct, offset };
  });

  return (
    <div className="donut-wrap">
      <div className="donut-svg-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {slices.map((s, i) => {
            const dashLen = s.pct * circumference;
            const dashOffset = circumference - s.offset * circumference;
            return (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={r - hole}
                strokeDasharray={`${dashLen} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={hole} fill="#fff" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F172A">
            {total}
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fill="#64748B">
            Total
          </text>
        </svg>
      </div>
      <div className="donut-legend">
        {slices.map((s) => (
          <div key={s.label} className="donut-legend-item">
            <span className="donut-legend-label">
              <span className="donut-legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="donut-legend-pct">{total > 0 ? (s.pct * 100).toFixed(1) : "0.0"}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Risk Score Distribution Bar Chart ---- */
function RiskDistChart({ results }: { results: DetectionResult[] }) {
  const bins = [
    { label: "0–25 (Low)", min: 0, max: 25, color: "#16A34A" },
    { label: "26–50 (Medium)", min: 26, max: 50, color: "#D97706" },
    { label: "51–75 (High)", min: 51, max: 75, color: "#DC2626" },
    { label: "76–100 (Critical)", min: 76, max: 100, color: "#991B1B" },
  ];

  const total = results.length || 1;
  const counts = bins.map((b) => ({
    ...b,
    count: results.filter((r) => r.riskScore >= b.min && r.riskScore <= b.max).length,
  }));

  return (
    <div className="risk-dist-list">
      {counts.map((b) => (
        <div key={b.label} className="risk-dist-item">
          <div className="risk-dist-header">
            <span className="risk-dist-label">{b.label}</span>
            <span className="risk-dist-pct">{((b.count / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="risk-dist-bar-track">
            <div
              className="risk-dist-bar"
              style={{ width: `${(b.count / total) * 100}%`, background: b.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Detail Panel ---- */
function DetailPanel({ result, onClose }: { result: DetectionResult; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "analysis" | "domain">("overview");
  const sc = getStatusClass(result.classification);
  const label = getRiskLabel(result.classification);

  const mlScore = result.mlConfidence ? Math.round(result.mlConfidence * 100) : Math.round(result.riskScore * 0.9);
  const heuristicScore = result.riskScore;

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
                <p className="detail-section-title">Detected Heuristics</p>
                <div className="detail-list">
                  {result.features.map((f, i) => (
                    <div key={i} className="detail-list-item">
                      <span className="detail-list-dot" style={{ background: "#2563EB" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="detail-section">
                <p className="detail-section-title">Flag Reasons</p>
                <div className="detail-list">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="detail-list-item">
                      <span className="detail-list-dot" style={{ background: "#DC2626" }} />
                      {r}
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

/* ---- Main Dashboard ---- */
export default function Dashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<DetectionResult | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

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
    } catch {
      setLoading(false);
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    setPage(1);
    if (!q.trim()) {
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
          <p style={{ fontSize: "0.9rem" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalScans = stats?.totalScans ?? 0;
  const safeCount = stats?.safeCount ?? 0;
  const phishingCount = stats?.phishingDetected ?? 0;
  const suspiciousCount = stats?.suspiciousDetected ?? 0;
  const highRiskCount = phishingCount + suspiciousCount;
  const detectionAccuracy = stats?.detectionAccuracy ?? 0;
  const avgRiskScore = stats?.avgRiskScore ?? 0;

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* ---- STAT CARDS ---- */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue"><IconScan /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">URLs Scanned</p>
            <p className="stat-card-value">{totalScans.toLocaleString()}</p>
            <div className="stat-card-trend up">
              <IconTrendUp />
              <span>All-time total</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon green"><IconShieldCheck /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Safe URLs</p>
            <p className="stat-card-value">{safeCount.toLocaleString()}</p>
            <div className="stat-card-trend up">
              <IconTrendUp />
              <span>{totalScans > 0 ? ((safeCount / totalScans) * 100).toFixed(1) : 0}% of total</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon red"><IconShieldAlert /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Threats Blocked</p>
            <p className="stat-card-value">{phishingCount.toLocaleString()}</p>
            <div className="stat-card-trend down">
              <IconTrendUp />
              <span>{totalScans > 0 ? ((phishingCount / totalScans) * 100).toFixed(1) : 0}% phishing rate</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon orange"><IconAlertOctagon /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">High Risk URLs</p>
            <p className="stat-card-value">{highRiskCount.toLocaleString()}</p>
            <div className="stat-card-trend neutral">
              <span>Phishing + Suspicious</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon purple"><IconActivity /></div>
          <div className="stat-card-body">
            <p className="stat-card-label">Detection Accuracy</p>
            <p className="stat-card-value">{detectionAccuracy}%</p>
            <div className="stat-card-trend up">
              <IconTrendUp />
              <span>ML classifier</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- CHARTS ROW ---- */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-title">Threat Trend</p>
              <p className="chart-subtitle">Detection activity over time</p>
            </div>
            <button className="chart-filter">
              Last 7 days <IconChevronDown />
            </button>
          </div>
          <LineTrendChart results={results} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-title">Threat Distribution</p>
            </div>
          </div>
          <DonutChart phishing={phishingCount} suspicious={suspiciousCount} safe={safeCount} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <p className="chart-title">Risk Score Distribution</p>
            </div>
          </div>
          <RiskDistChart results={results} />
        </div>
      </div>

      {/* ---- ALERTS (if any) ---- */}
      {alerts.length > 0 && (
        <div className="table-card" style={{ marginBottom: "1.25rem" }}>
          <div className="table-card-header">
            <p className="table-card-title">Active Alerts ({alerts.length})</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td><span className={`status-badge ${getSeverityClass(a.severity)}`}>{a.severity}</span></td>
                  <td style={{ fontSize: "0.82rem" }}>{a.alertType}</td>
                  <td style={{ fontSize: "0.82rem", color: "#64748B" }}>{a.message}</td>
                  <td className="table-date-cell">{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- RECENT SCANS TABLE ---- */}
      <div className="table-card">
        <div className="table-card-header">
          <p className="table-card-title">Recent Scans</p>
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
            <div style={{ overflowX: "auto" }}>
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
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn${p === page ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
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
      </div>

      {/* Detail Panel */}
      {selectedResult && (
        <DetailPanel result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </>
  );
}
