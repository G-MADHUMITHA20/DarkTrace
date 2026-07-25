import { useEffect, useState } from "react";
import { IconBarChart, IconDownload, IconFilter } from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

interface ReportItem {
  id: string | number;
  name: string;
  date: string;
  type: string;
  size: string;
}

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/history?limit=100`);
        if (!res.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await res.json();
        const mapped = (data.results || []).map((r: any) => {
          const type = r.kind === "url" ? "PDF" : "CSV";
          const size = `${(1.2 + (r.riskScore || 0) * 0.05).toFixed(1)} MB`;
          const date = r.processedAt ? new Date(r.processedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
          const displayName = r.kind === "url" 
            ? `URL Scan Report - ${r.input}` 
            : `Email Scan Report - ${r.emailParsedData?.subject || r.input}`;
          return {
            id: r.id,
            name: displayName,
            date,
            type,
            size
          };
        });
        setReports(mapped);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReports((prev) => [
        { 
          id: Date.now(), 
          name: "Ad-hoc Security Scan Report", 
          date: new Date().toISOString().split("T")[0], 
          type: "PDF", 
          size: "1.1 MB" 
        },
        ...prev
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleDownload = (name: string) => {
    alert(`Downloading ${name}...`);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="table-card">
        <div className="table-card-header">
          <div>
            <p className="table-card-title">Security Reports</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Generate and export security metrics for compliance and analysis.</p>
          </div>
          <div className="table-card-actions">
            <button className="table-filter-btn">
              <IconFilter /> Filter by Date
            </button>
            <button className="export-btn" onClick={handleGenerate} disabled={isGenerating}>
              <IconBarChart /> {isGenerating ? "Generating..." : "Generate New Report"}
            </button>
          </div>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Format</th>
              <th>Size</th>
              <th>Generated Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  <div className="loading-spinner" style={{ margin: "0 auto 1rem", width: "30px", height: "30px" }} />
                  Loading reports...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--danger)" }}>
                  {error}
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  No reports generated yet.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td style={{ fontWeight: 500, color: "var(--text)" }}>{report.name}</td>
                  <td><span className={`status-badge ${report.type === 'PDF' ? 'critical' : 'safe'}`}>{report.type}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{report.size}</td>
                  <td className="table-date-cell">{report.date}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="export-btn" onClick={() => handleDownload(report.name)}>
                      <IconDownload /> Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
