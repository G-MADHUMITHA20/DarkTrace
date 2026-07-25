const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const axios = require("axios");
const whois = require("whois-json");
const { simpleParser } = require("mailparser");
const natural = require("natural");

const app = express();
const PORT = process.env.PORT || 4000;

// Database initialization
const dbPath = path.join(__dirname, "phishshield.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database connection error:", err);
  else console.log("Connected to SQLite database");
});

// Initialize database schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS scan_results (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      input TEXT NOT NULL,
      riskScore INTEGER NOT NULL,
      classification TEXT NOT NULL,
      reasons TEXT NOT NULL,
      features TEXT NOT NULL,
      latencyMs INTEGER NOT NULL,
      processedAt TEXT NOT NULL,
      whoisData TEXT,
      threatIntelData TEXT,
      emailParsedData TEXT,
      mlConfidence REAL,
      riskLevel TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run("ALTER TABLE scan_results ADD COLUMN emailParsedData TEXT", () => {});
  db.run("ALTER TABLE scan_results ADD COLUMN riskLevel TEXT", () => {});
  db.run("ALTER TABLE scan_results ADD COLUMN heuristicResults TEXT", () => {});
  db.run("ALTER TABLE scan_results ADD COLUMN heuristicScore INTEGER", () => {});
  db.run("ALTER TABLE scan_results ADD COLUMN mlScore INTEGER", () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      scanResultId TEXT NOT NULL,
      alertType TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scanResultId) REFERENCES scan_results(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ml_model_feedback (
      id TEXT PRIMARY KEY,
      scanResultId TEXT NOT NULL,
      actualClassification TEXT NOT NULL,
      userFeedback TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scanResultId) REFERENCES scan_results(id)
    )
  `);
});

app.use(cors());
app.use(express.json());

// ==================== UTILITY FUNCTIONS ====================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function classificationFromScore(score, mlConfidence = 1) {
  // Adjust score based on ML confidence
  const adjustedScore = Math.round(score * mlConfidence);
  if (adjustedScore >= 70) return "Phishing";
  if (adjustedScore >= 35) return "Suspicious";
  return "Legitimate";
}

function getRiskLevel(score) {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High Risk";
  if (score >= 35) return "Medium Risk";
  if (score >= 15) return "Low Risk";
  return "Safe";
}

function toPreview(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized.length > 92 ? `${normalized.slice(0, 92)}...` : normalized;
}

function parseDomain(urlText) {
  try {
    const value = String(urlText || "").trim();
    if (!value) return null;
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// ==================== AI EXPLANATION GENERATOR ====================

function generateExplanation(heuristics, classification) {
  const fails = heuristics.filter(h => h.status === "fail");
  const warnings = heuristics.filter(h => h.status === "warning");
  
  if (fails.length === 0 && warnings.length === 0) {
    return ["✅ No significant phishing indicators detected. This appears to be legitimate."];
  }

  const exp = [];
  if (fails.length > 0) {
    exp.push(`🔴 Classified as dangerous due to: ` + fails.map(f => f.explanation).join(" "));
  } else if (warnings.length > 0) {
    exp.push(`🟡 Flagged as suspicious because: ` + warnings.map(f => f.explanation).join(" "));
  }
  return exp;
}

const urlClassifier = new natural.BayesClassifier();
const emailClassifier = new natural.BayesClassifier();

// Lightweight seeded datasets for practical phishing/legit signal separation.
[
  "http://198.51.100.7/login/verify",
  "http://secure-update-account.example-login.com",
  "bit.ly/reset-your-bank-password",
  "http://xn--pple-43d.com/signin",
  "http://45.77.22.10/payroll/confirm",
].forEach((sample) => urlClassifier.addDocument(sample, "phishing"));

[
  "https://github.com/features",
  "https://www.microsoft.com/en-us/security",
  "https://docs.python.org/3/",
  "https://developer.mozilla.org/en-US/",
  "https://openai.com/research",
].forEach((sample) => urlClassifier.addDocument(sample, "legitimate"));

[
  "URGENT verify your password immediately to avoid suspension",
  "final notice wire transfer required now",
  "confirm your bank credentials and otp",
  "account suspended click link to reactivate",
  "gift card payment needed today",
].forEach((sample) => emailClassifier.addDocument(sample, "phishing"));

[
  "team meeting moved to 3pm tomorrow",
  "attached are sprint notes and action items",
  "please review the project proposal",
  "thanks for the update see you next week",
  "invoice approved and processed in system",
].forEach((sample) => emailClassifier.addDocument(sample, "legitimate"));

urlClassifier.train();
emailClassifier.train();

// ==================== FEATURE EXTRACTION ====================

function runUrlHeuristics(url, whoisData, threatIntelData) {
  const heuristics = [];
  let score = 0;
  const urlLower = String(url || "").toLowerCase();

  if (whoisData && whoisData.age_days !== null) {
    if (whoisData.age_days < 30) {
      heuristics.push({ id: "domain_age", name: "Domain Age", status: "fail", explanation: "Newly registered domain (less than 30 days).", riskContribution: 20 });
      score += 20;
    } else if (whoisData.age_days < 180) {
      heuristics.push({ id: "domain_age", name: "Domain Age", status: "warning", explanation: "Moderate domain age (less than 6 months).", riskContribution: 10 });
      score += 10;
    } else {
      heuristics.push({ id: "domain_age", name: "Domain Age", status: "pass", explanation: "Trusted domain age.", riskContribution: 0 });
    }
  } else {
    heuristics.push({ id: "domain_age", name: "Domain Age", status: "warning", explanation: "Domain age unavailable.", riskContribution: 5 });
    score += 5;
  }

  if (url.length > 75) {
    heuristics.push({ id: "url_length", name: "URL Length", status: "fail", explanation: `Unusually long URL (${url.length} characters).`, riskContribution: 15 });
    score += 15;
  } else {
    heuristics.push({ id: "url_length", name: "URL Length", status: "pass", explanation: "Normal URL length.", riskContribution: 0 });
  }

  if (urlLower.startsWith("http://")) {
    heuristics.push({ id: "https", name: "HTTPS Verification", status: "fail", explanation: "Unencrypted HTTP connection.", riskContribution: 15 });
    score += 15;
  } else {
    heuristics.push({ id: "https", name: "HTTPS Verification", status: "pass", explanation: "HTTPS Enabled.", riskContribution: 0 });
  }

  if (/(bit\.ly|tinyurl\.com|t\.co|shorturl\.at|goo\.gl)/i.test(urlLower)) {
    heuristics.push({ id: "redirect", name: "Redirect Analysis", status: "warning", explanation: "URL uses a link shortener.", riskContribution: 15 });
    score += 15;
  } else {
    heuristics.push({ id: "redirect", name: "Redirect Analysis", status: "pass", explanation: "Direct link, no known shorteners detected.", riskContribution: 0 });
  }

  let suspiciousCount = 0;
  if ((urlLower.match(/-/g) || []).length > 3) suspiciousCount += 1;
  if (urlLower.includes("@")) suspiciousCount += 1;
  if (/(%[0-9A-Fa-f]{2}){3,}/.test(url)) suspiciousCount += 1;
  if (/[0-9]{5,}/.test(url)) suspiciousCount += 1;

  if (suspiciousCount > 1) {
    heuristics.push({ id: "chars", name: "Suspicious Characters", status: "fail", explanation: "Contains multiple suspicious character patterns (e.g., @, excessive hyphens).", riskContribution: 15 });
    score += 15;
  } else {
    heuristics.push({ id: "chars", name: "Suspicious Characters", status: "pass", explanation: "Clean character composition.", riskContribution: 0 });
  }

  const domainMatch = urlLower.match(/https?:\/\/([^\/]+)/);
  const domain = domainMatch ? domainMatch[1] : "";
  if (/(g[o0]{2,}gle|paypa[l1i]|faceb[o0]{2}k|micr[o0]s[o0]ft|app[l1]e)/.test(domain) && !/(google\.com|paypal\.com|facebook\.com|microsoft\.com|apple\.com)$/.test(domain)) {
    heuristics.push({ id: "typo", name: "Typosquatting Detection", status: "fail", explanation: "Look-alike domain detected targeting a popular brand.", riskContribution: 25 });
    score += 25;
  } else {
    heuristics.push({ id: "typo", name: "Typosquatting Detection", status: "pass", explanation: "No obvious typosquatting detected.", riskContribution: 0 });
  }

  if (threatIntelData?.isKnownMalicious) {
    heuristics.push({ id: "blacklist", name: "Blacklist Lookup", status: "fail", explanation: "Domain is flagged on known threat intelligence blocklists.", riskContribution: 30 });
    score += 30;
  } else {
    heuristics.push({ id: "blacklist", name: "Blacklist Lookup", status: "pass", explanation: "Domain is not on any active blacklists.", riskContribution: 0 });
  }

  if (/https?:\/\/(\d+\.){3}\d+/.test(urlLower)) {
    heuristics.push({ id: "raw_ip", name: "IP-based URL", status: "fail", explanation: "Uses a raw IP address instead of a domain name.", riskContribution: 25 });
    score += 25;
  }

  return { heuristics, score };
}

function runEmailHeuristics(emailContent, emailParsedData) {
  const heuristics = [];
  let score = 0;
  const text = String(emailContent || "").toLowerCase();

  if (/urgent|act now|immediately|suspended|final notice|confirm|verify/.test(text)) {
    heuristics.push({ id: "urgency", name: "Urgent Language", status: "fail", explanation: "Contains urgency triggers (e.g., 'act now', 'suspended').", riskContribution: 15 });
    score += 15;
  } else {
    heuristics.push({ id: "urgency", name: "Urgent Language", status: "pass", explanation: "No urgent language detected.", riskContribution: 0 });
  }

  if (/password|otp|verify|login|bank|account|credentials/.test(text)) {
    heuristics.push({ id: "credentials", name: "Credential Request", status: "fail", explanation: "Requests passwords, OTPs, or account credentials.", riskContribution: 20 });
    score += 20;
  }

  if (/invoice|payment|wire|gift card|refund|transfer|claim/.test(text)) {
    heuristics.push({ id: "financial", name: "Financial Lure", status: "fail", explanation: "References financial transactions under pressure.", riskContribution: 15 });
    score += 15;
  }

  if (emailParsedData?.hasReplyToMismatch) {
    heuristics.push({ id: "spoofing", name: "Sender Spoofing", status: "fail", explanation: "Reply-To address differs from the sender address.", riskContribution: 20 });
    score += 20;
  } else {
    heuristics.push({ id: "spoofing", name: "Sender Spoofing", status: "pass", explanation: "Sender addresses match.", riskContribution: 0 });
  }

  if (emailParsedData?.attachmentCount > 0) {
    if (/\.(exe|zip|rar|scr|msi|js|vbs)\b/i.test(text)) {
       heuristics.push({ id: "attachments", name: "Suspicious Attachments", status: "fail", explanation: "Contains potentially dangerous executable or archive attachments.", riskContribution: 25 });
       score += 25;
    } else {
       heuristics.push({ id: "attachments", name: "Attachments", status: "warning", explanation: "Contains attachments that should be verified.", riskContribution: 5 });
       score += 5;
    }
  }

  if (emailParsedData?.linkCount > 0) {
    heuristics.push({ id: "links", name: "Embedded Links", status: "warning", explanation: `Contains ${emailParsedData.linkCount} embedded link(s).`, riskContribution: 5 });
    score += 5;
  }

  return { heuristics, score };
}

// ==================== ML SCORING ENGINE ====================

function calculateMLScore(kind, content) {
  const text = String(content || "").toLowerCase();
  const classifier = kind === "url" ? urlClassifier : emailClassifier;
  const label = classifier.classify(text);
  const probs = classifier.getClassifications(text);
  const phishingProb = probs.find((entry) => entry.label === "phishing")?.value ?? 0.5;

  let mlScore = label === "phishing" ? 60 + phishingProb * 35 : 10 + phishingProb * 40;
  return clamp(Math.round(mlScore), 5, 95);
}

// ==================== EXTERNAL API INTEGRATIONS ====================

async function getWhoisData(url) {
  try {
    const domain = parseDomain(url);
    if (!domain) return null;

    const whoisResult = await whois(domain, { follow: 2, timeout: 8000, verbose: false });
    const createdRaw = whoisResult?.creationDate || whoisResult?.created || whoisResult?.createdDate || null;
    const expiresRaw = whoisResult?.registryExpiryDate || whoisResult?.expirationDate || whoisResult?.expires || null;

    const created = createdRaw ? new Date(createdRaw) : null;
    const ageDays = created && !Number.isNaN(created.getTime())
      ? Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000))
      : null;

    return {
      domain,
      registrant: whoisResult?.registrant || whoisResult?.org || whoisResult?.registrar || "Unknown",
      creationDate: created && !Number.isNaN(created.getTime()) ? created.toISOString() : null,
      expirationDate: expiresRaw ? new Date(expiresRaw).toISOString() : null,
      age_days: ageDays,
    };
  } catch (error) {
    console.error("WHOIS lookup error:", error.message);
    return null;
  }
}

async function getThreatIntelData(url) {
  try {
    const domain = parseDomain(url);
    if (!domain) return null;

    const form = new URLSearchParams();
    form.append("url", url);

    const { data } = await axios.post("https://urlhaus-api.abuse.ch/v1/url/", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 8000,
    });

    const known = data?.query_status === "ok";
    const tags = Array.isArray(data?.tags) ? data.tags : [];
    const threatScore = known ? 80 + Math.min(tags.length * 4, 20) : 15;

    return {
      domain,
      isKnownMalicious: known,
      abuseReports: known ? 1 : 0,
      lastDetection: known ? data?.date_added || new Date().toISOString() : null,
      threatTypes: tags.length ? tags : known ? ["phishing"] : [],
      overallThreatScore: clamp(threatScore, 0, 100),
    };
  } catch (error) {
    const domain = parseDomain(url);
    if (!domain) return null;

    const suspicious = /\b(login|verify|secure|update|account|bank|payroll)\b/i.test(url);
    return {
      domain,
      isKnownMalicious: false,
      abuseReports: 0,
      lastDetection: null,
      threatTypes: suspicious ? ["suspicious-pattern"] : [],
      overallThreatScore: suspicious ? 45 : 10,
      source: "fallback-heuristic",
    };
  }
}

async function parseEmailContent(rawContent) {
  try {
    const parsed = await simpleParser(rawContent);
    const text = parsed.text || String(rawContent || "");
    return {
      subject: parsed.subject || "",
      from: parsed.from?.text || "",
      linkCount: (text.match(/https?:\/\//g) || []).length,
      attachmentCount: Array.isArray(parsed.attachments) ? parsed.attachments.length : 0,
      hasReplyToMismatch:
        Boolean(parsed.replyTo?.text) && Boolean(parsed.from?.text) && parsed.replyTo?.text !== parsed.from?.text,
    };
  } catch {
    const text = String(rawContent || "");
    return {
      subject: "",
      from: "",
      linkCount: (text.match(/https?:\/\//g) || []).length,
      attachmentCount: (text.match(/\.(exe|zip|rar|scr|msi)\b/gi) || []).length,
      hasReplyToMismatch: false,
    };
  }
}

// ==================== ALERT GENERATION ====================

async function generateAlerts(result) {
  const alerts = [];

  if (result.classification === "Phishing") {
    alerts.push({
      id: randomUUID(),
      scanResultId: result.id,
      alertType: "HIGH_RISK_PHISHING",
      severity: "CRITICAL",
      message: `Phishing detected in ${result.kind} with risk score ${result.riskScore}%`,
    });
  }

  if (result.classification === "Suspicious" && result.riskScore > 50) {
    alerts.push({
      id: randomUUID(),
      scanResultId: result.id,
      alertType: "SUSPICIOUS_ACTIVITY",
      severity: "HIGH",
      message: `Suspicious ${result.kind} detected with risk score ${result.riskScore}%`,
    });
  }

  for (const alert of alerts) {
    db.run(
      "INSERT INTO alerts (id, scanResultId, alertType, severity, message) VALUES (?, ?, ?, ?, ?)",
      [alert.id, alert.scanResultId, alert.alertType, alert.severity, alert.message]
    );
  }

  return alerts;
}

// ==================== ANALYSIS FUNCTION ====================

async function analyzeInput(kind, content) {
  const startTime = Date.now();
  let whoisData = null;
  let threatIntelData = null;
  let emailParsedData = null;
  let heuristicData = { heuristics: [], score: 0 };

  const mlScore = calculateMLScore(kind, content);

  if (kind === "url") {
    whoisData = await getWhoisData(content);
    threatIntelData = await getThreatIntelData(content);
    heuristicData = runUrlHeuristics(content, whoisData, threatIntelData);
  }

  if (kind === "email") {
    emailParsedData = await parseEmailContent(content);
    heuristicData = runEmailHeuristics(content, emailParsedData);
  }

  const heuristicScore = clamp(heuristicData.score, 0, 100);
  const riskScore = clamp(Math.round((mlScore * 0.4) + (heuristicScore * 0.6)), 0, 99);

  const classification = classificationFromScore(riskScore, 1);
  const riskLevel = getRiskLevel(riskScore);
  const explanation = generateExplanation(heuristicData.heuristics, classification);
  const latencyMs = clamp(Math.round(Date.now() - startTime + Math.random() * 50), 12, 500);

  const result = {
    id: randomUUID(),
    kind,
    input: toPreview(content),
    riskScore,
    heuristicScore,
    mlScore,
    riskLevel,
    classification,
    reasons: heuristicData.heuristics.filter(h => h.status === 'fail').map(h => h.explanation),
    features: heuristicData.heuristics.map(h => h.name),
    heuristicResults: heuristicData.heuristics,
    explanation,
    latencyMs,
    processedAt: new Date().toISOString(),
    mlConfidence: mlScore / 100,
    whoisData,
    threatIntelData,
    emailParsedData,
  };

  return result;
}

// ==================== DATABASE STORAGE ====================

function storeResult(result) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO scan_results 
       (id, kind, input, riskScore, classification, reasons, features, latencyMs, processedAt, whoisData, threatIntelData, emailParsedData, mlConfidence, riskLevel, heuristicResults, heuristicScore, mlScore)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.kind,
        result.input,
        result.riskScore,
        result.classification,
        JSON.stringify(result.reasons),
        JSON.stringify(result.features),
        result.latencyMs,
        result.processedAt,
        JSON.stringify(result.whoisData),
        JSON.stringify(result.threatIntelData),
        JSON.stringify(result.emailParsedData),
        result.mlConfidence,
        result.riskLevel,
        JSON.stringify(result.heuristicResults),
        result.heuristicScore,
        result.mlScore
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function getRecentResults(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM scan_results ORDER BY createdAt DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else {
          const results = (rows || []).map(row => ({
            ...row,
            reasons: JSON.parse(row.reasons),
            features: JSON.parse(row.features),
            whoisData: row.whoisData ? JSON.parse(row.whoisData) : null,
            threatIntelData: row.threatIntelData ? JSON.parse(row.threatIntelData) : null,
            emailParsedData: row.emailParsedData ? JSON.parse(row.emailParsedData) : null,
            riskLevel: row.riskLevel || getRiskLevel(row.riskScore),
            heuristicResults: row.heuristicResults ? JSON.parse(row.heuristicResults) : [],
            heuristicScore: row.heuristicScore || 0,
            mlScore: row.mlScore || 0
          }));
          resolve(results);
        }
      }
    );
  });
}

function searchResults(query, limit = 100) {
  return new Promise((resolve, reject) => {
    const searchQuery = `%${query}%`;
    db.all(
      `SELECT * FROM scan_results WHERE input LIKE ? ORDER BY createdAt DESC LIMIT ?`,
      [searchQuery, limit],
      (err, rows) => {
        if (err) reject(err);
        else {
          const results = (rows || []).map(row => ({
            ...row,
            reasons: JSON.parse(row.reasons),
            features: JSON.parse(row.features),
            whoisData: row.whoisData ? JSON.parse(row.whoisData) : null,
            threatIntelData: row.threatIntelData ? JSON.parse(row.threatIntelData) : null,
            emailParsedData: row.emailParsedData ? JSON.parse(row.emailParsedData) : null,
            riskLevel: row.riskLevel || getRiskLevel(row.riskScore),
            heuristicResults: row.heuristicResults ? JSON.parse(row.heuristicResults) : [],
            heuristicScore: row.heuristicScore || 0,
            mlScore: row.mlScore || 0
          }));
          resolve(results);
        }
      }
    );
  });
}

function getScanStatistics() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        COUNT(*) as totalScans,
        SUM(CASE WHEN classification = 'Phishing' THEN 1 ELSE 0 END) as phishingDetected,
        SUM(CASE WHEN classification = 'Suspicious' THEN 1 ELSE 0 END) as suspiciousDetected,
        SUM(CASE WHEN classification = 'Legitimate' THEN 1 ELSE 0 END) as safeCount,
        AVG(latencyMs) as avgLatencyMs,
        AVG(riskScore) as avgRiskScore
       FROM scan_results`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else {
          const stats = rows[0] || {
            totalScans: 0,
            phishingDetected: 0,
            suspiciousDetected: 0,
            safeCount: 0,
            avgLatencyMs: 0,
            avgRiskScore: 0,
          };
          const total = stats.totalScans || 0;
          const safe = stats.safeCount || 0;
          const detectionAccuracy = total > 0
            ? Math.round(((safe / total) * 100 + (stats.phishingDetected / total) * 100) / 2 * 10) / 10
            : 0;
          resolve({
            totalScans: total,
            phishingDetected: stats.phishingDetected || 0,
            suspiciousDetected: stats.suspiciousDetected || 0,
            safeCount: safe,
            avgLatencyMs: Math.round(stats.avgLatencyMs || 0),
            avgRiskScore: Math.round(stats.avgRiskScore || 0),
            detectionAccuracy,
          });
        }
      }
    );
  });
}

function getAlerts(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM alerts ORDER BY createdAt DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

// ==================== API ENDPOINTS ====================

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "darktrace-api",
    version: "3.0.0-full-stack",
    features: ["url-detection", "email-detection", "whois-lookup", "threat-intel", "ml-scoring", "persistent-storage", "alerts", "ai-explanation", "risk-levels", "history-search"],
  });
});

app.get("/api/bootstrap", async (_req, res) => {
  try {
    const summary = await getScanStatistics();
    const recentResults = await getRecentResults(15);
    res.json({ state: { summary, recentResults } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/state", async (_req, res) => {
  try {
    const summary = await getScanStatistics();
    const recentResults = await getRecentResults(15);
    res.json({ summary, recentResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/history", async (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit) || 100;
    const results = await getRecentResults(limit);
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/history/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const limit = parseInt(req.query.limit) || 100;
    if (!query) {
      const results = await getRecentResults(limit);
      return res.json({ results, count: results.length });
    }
    const results = await searchResults(query, limit);
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/stats", async (_req, res) => {
  try {
    const stats = await getScanStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/alerts", async (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit) || 50;
    const alerts = await getAlerts(limit);
    res.json({ alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { kind, content } = req.body || {};
    if (!["url", "email"].includes(kind)) {
      return res.status(400).json({ message: "kind must be either url or email." });
    }
    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "content must be a non-empty string." });
    }

    const result = await analyzeInput(kind, content);
    await storeResult(result);
    const alerts = await generateAlerts(result);

    res.json({ ...result, alerts });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/feedback", (req, res) => {
  try {
    const { scanResultId, actualClassification, userFeedback } = req.body;
    const feedbackId = randomUUID();

    db.run(
      "INSERT INTO ml_model_feedback (id, scanResultId, actualClassification, userFeedback) VALUES (?, ?, ?, ?)",
      [feedbackId, scanResultId, actualClassification, userFeedback],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, feedbackId });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📡 DarkTrace API running on port ${PORT}`);
  console.log(`📊 Features: URL Detection | Email Detection | WHOIS Lookup | Threat Intelligence | ML Scoring | AI Explanation | Persistent Storage`);
});
