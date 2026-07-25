import { useEffect, useState } from "react";
import { IconBarChart, IconDownload, IconFilter } from "./icons";
import { jsPDF } from "jspdf";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

interface ReportItem {
  id: string | number;
  name: string;
  date: string;
  type: string;
  size: string;
  raw?: any;
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
            size,
            raw: r
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
      const mockRaw = {
        input: "https://darktrace-adhoc-check.io/dashboard/login",
        kind: "url",
        processedAt: new Date().toISOString(),
        riskScore: 82,
        riskLevel: "Critical",
        classification: "Phishing",
        mlScore: 88,
        heuristicScore: 76,
        explanation: [
          "The scanned page contains input fields mimicking corporate auth portals.",
          "ML classifier detected anomalous structural distributions.",
          "WHOIS database records show the hosting domain was registered very recently."
        ],
        heuristicResults: [
          { name: "Domain Creation Check", status: "fail", riskContribution: 40, explanation: "Target domain age is under 30 days." },
          { name: "Branding Spoof Check", status: "fail", riskContribution: 36, explanation: "Keyword mimicking registered trademarks." },
          { name: "SSL Certificate Validation", status: "pass", riskContribution: 0, explanation: "SSL certificate is validly signed." }
        ],
        reasons: [
          "Host name simulates corporate identity.",
          "Extreme risk probability returned by deep neural-net scan."
        ]
      };

      setReports((prev) => [
        { 
          id: Date.now(), 
          name: "Ad-hoc Security Scan Report", 
          date: new Date().toISOString().split("T")[0], 
          type: "PDF", 
          size: "1.1 MB",
          raw: mockRaw
        },
        ...prev
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  const generatePDF = (reportName: string, rawData?: any) => {
    const doc = new jsPDF();
    
    // Theme Colors
    const primaryColor = [15, 23, 42]; // slate-900
    const dangerColor = [220, 38, 38];
    const warningColor = [217, 119, 6];
    const successColor = [22, 163, 74];
    
    // Title & Branding banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DARKTRACE CYBERSECURITY", 15, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SYSTEM THREAT SCAN ANALYSIS REPORT", 15, 28);
    
    const dateStr = rawData?.processedAt 
      ? new Date(rawData.processedAt).toLocaleString() 
      : new Date().toLocaleString();
    doc.text(`Generated: ${dateStr}`, 140, 20);
    
    // Section header
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("1. EXECUTIVE ANALYSIS SUMMARY", 15, 55);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 58, 195, 58);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const inputVal = rawData?.input || "https://darktrace-adhoc-scan.internal";
    const kindVal = rawData?.kind || "url";
    
    doc.text(`Scanned Target (${kindVal.toUpperCase()}):`, 15, 66);
    doc.setFont("helvetica", "bold");
    doc.text(inputVal, 65, 66);
    doc.setFont("helvetica", "normal");
    
    const riskScore = rawData?.riskScore !== undefined ? rawData.riskScore : 65;
    const classification = rawData?.classification || "Suspicious";
    const riskLevel = rawData?.riskLevel || "Medium Risk";
    const mlScore = rawData?.mlScore !== undefined ? rawData.mlScore : 60;
    const heuristicScore = rawData?.heuristicScore !== undefined ? rawData.heuristicScore : 70;
    
    doc.text("Threat Level:", 15, 73);
    let severityColor = successColor;
    if (riskScore >= 75) severityColor = dangerColor;
    else if (riskScore >= 35) severityColor = warningColor;
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
    doc.text(`${classification} (${riskLevel})`, 65, 73);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    
    doc.text("Overall Threat Risk Score:", 15, 80);
    doc.setFont("helvetica", "bold");
    doc.text(`${riskScore} / 100`, 65, 80);
    doc.setFont("helvetica", "normal");
    
    doc.text("ML Classifier Probability Score:", 15, 87);
    doc.text(`${mlScore} / 100`, 65, 87);
    
    doc.text("Heuristics Engine Score:", 15, 94);
    doc.text(`${heuristicScore} / 100`, 65, 94);
    
    // AI Explanation Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. CORE AI EXPLANATORY ANALYSIS", 15, 107);
    doc.line(15, 110, 195, 110);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const explanationText = rawData?.explanation 
      ? rawData.explanation.join(" ") 
      : "The automated platform scanned this asset and analyzed payload weights. Model vectors indicate anomalous pattern matching. Warning indicators are triggered due to mismatch parameters.";
    
    const splitExplanation = doc.splitTextToSize(explanationText, 172);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 115, 180, splitExplanation.length * 5 + 8, "F");
    doc.text(splitExplanation, 18, 121);
    
    let currentY = 115 + splitExplanation.length * 5 + 18;
    
    // Heuristic Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. HEURISTIC RULE CHECKS", 15, currentY);
    currentY += 3;
    doc.line(15, currentY, 195, currentY);
    currentY += 6;
    
    const heuristics = rawData?.heuristicResults || [
      { name: "Domain Age Check", status: "pass", riskContribution: 0, explanation: "Registered domain exceeds threat parameters." },
      { name: "Keywords Entropy Match", status: "fail", riskContribution: 45, explanation: "Anomalous name strings or mimicking checks." }
    ];
    
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Security Rule", 17, currentY);
    doc.text("Status", 95, currentY);
    doc.text("Risk Impact", 130, currentY);
    doc.text("Details", 155, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 4;
    
    heuristics.forEach((h: any) => {
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY - 2, 195, currentY - 2);
      
      doc.text(h.name, 17, currentY);
      
      let badgeColor = successColor;
      if (h.status === "fail") badgeColor = dangerColor;
      else if (h.status === "warning") badgeColor = warningColor;
      doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(h.status.toUpperCase(), 95, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      
      doc.text(`+${h.riskContribution || 0}`, 132, currentY);
      
      const descText = h.explanation || "";
      const splitDesc = doc.splitTextToSize(descText, 38);
      doc.text(splitDesc, 155, currentY);
      
      currentY += Math.max(splitDesc.length * 4.5, 6);
    });
    
    // Risk Factors
    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("4. IDENTIFIED RISK FACTORS", 15, currentY);
    currentY += 3;
    doc.line(15, currentY, 195, currentY);
    currentY += 6;
    
    const reasons = rawData?.reasons || [
      "Domain age check flagged newer registration constraints.",
      "Visual similarity triggers high spoofing ratios."
    ];
    
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    reasons.forEach((r: string) => {
      doc.text(`•  ${r}`, 18, currentY);
      currentY += 5;
    });
    
    // Recommendations
    currentY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("5. RECOMMENDED COUNTERMEASURES", 15, currentY);
    currentY += 3;
    doc.line(15, currentY, 195, currentY);
    currentY += 6;
    
    const recs = [
      "Avoid entering corporate login credentials on unauthorized portals.",
      "Check registered domain WHOIS logs to confirm organizational ownership.",
      "Utilize the DarkTrace client browser extension for automated domain blocking."
    ];
    
    recs.forEach((r: string, idx: number) => {
      doc.text(`${idx + 1}.  ${r}`, 18, currentY);
      currentY += 5.5;
    });
    
    // Branding Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("DarkTrace Advanced Threat Intelligence Center © 2026. Confidential Report.", 15, 285);
    doc.text("Page 1 of 1", 185, 285);
    
    doc.save(`${reportName.replace(/\s+/g, "_")}.pdf`);
  };

  const generateCSV = (reportName: string, rawData?: any) => {
    const headers = ["Metric Parameter", "Report Scan Value"];
    const rows = [
      ["Report Name", reportName],
      ["Scan Timestamp", rawData?.processedAt || new Date().toLocaleString()],
      ["Asset Type", rawData?.kind || "url"],
      ["Asset Address", rawData?.input || ""],
      ["Risk Level Score", rawData?.riskScore !== undefined ? String(rawData.riskScore) : "65"],
      ["Threat Classification", rawData?.classification || "Suspicious"],
      ["Severity Risk Grade", rawData?.riskLevel || "Medium Risk"],
      ["ML Model Score", rawData?.mlScore !== undefined ? String(rawData.mlScore) : "60"],
      ["Heuristic Logic Score", rawData?.heuristicScore !== undefined ? String(rawData.heuristicScore) : "70"],
      ["Scan Latency", `${rawData?.latencyMs || 0} ms`],
      ["AI Explanatory Logs", rawData?.explanation ? rawData.explanation.join(" ") : ""],
      ["Identified Threat Vectors", rawData?.reasons ? rawData.reasons.join(" | ") : ""],
      ["Heuristics Summary Details", rawData?.heuristicResults ? rawData.heuristicResults.map((h: any) => `${h.name}: ${h.status} (+${h.riskContribution})`).join(" | ") : ""]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = (name: string, type: string, rawData?: any) => {
    if (type === "PDF") {
      generatePDF(name, rawData);
    } else {
      generateCSV(name, rawData);
    }
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
                    <button className="export-btn download-btn" onClick={() => handleDownload(report.name, report.type, report.raw)}>
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
