import { useState } from "react";
import { IconBarChart, IconDownload, IconFilter } from "./icons";

const MOCK_REPORTS = [
  { id: 1, name: "Weekly Executive Summary", date: "2026-07-24", type: "PDF", size: "2.4 MB" },
  { id: 2, name: "Phishing Threat Landscape", date: "2026-07-20", type: "CSV", size: "845 KB" },
  { id: 3, name: "Network Anomaly Log", date: "2026-07-15", type: "JSON", size: "12.1 MB" },
  { id: 4, name: "Monthly Board Report", date: "2026-07-01", type: "PDF", size: "4.1 MB" },
];

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState(MOCK_REPORTS);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setReports([
        { id: Date.now(), name: "Ad-hoc Security Scan Report", date: new Date().toISOString().split("T")[0], type: "PDF", size: "1.1 MB" },
        ...reports
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
            {reports.map((report) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
