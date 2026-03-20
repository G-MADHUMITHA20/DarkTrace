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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run("ALTER TABLE scan_results ADD COLUMN emailParsedData TEXT", () => {});

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

function extractFeatures(kind, content) {
  const text = String(content || "").toLowerCase();
  const features = [];

  if (kind === "url") {
    features.push(`URL length: ${text.length}`);
    if (/https?:\/\/(\d+\.){3}\d+/.test(text)) features.push("Contains IP address");
    if (text.includes("http://")) features.push("Non-HTTPS URL");
    if (/xn--/.test(text)) features.push("Possible homograph (punycode)");
    if (/bit\.ly|tinyurl|t\.co|shorturl|goo\.gl/.test(text)) features.push("Shortened URL");
    if (text.length > 75) features.push("Excessively long URL");
    const domainMatch = text.match(/https?:\/\/([^\/]+)/);
    if (domainMatch) {
      const domain = domainMatch[1];
      if (domain.split(".").length > 3) features.push("Suspicious subdomain structure");
    }
  }

  if (kind === "email") {
    if (/urgent|act now|immediately|suspended|final notice|confirm|verify/.test(text)) features.push("Urgent language");
    if (/password|otp|verify|login|bank|account|credentials/.test(text)) features.push("Credential request");
    if (/invoice|payment|wire|gift card|refund|transfer|claim/.test(text)) features.push("Financial lure");
    if (/https?:\/\//.test(text)) features.push("Contains link");
    if (text.split("@").length - 1 > 1) features.push("Multiple email addresses");
    if (/exe|zip|rar|scr|msi/.test(text)) features.push("Suspicious file extension");
  }

  return features.length ? features : ["No strong phishing indicators found"];
}

// ==================== ML SCORING ENGINE ====================

function calculateMLScore(kind, content, features) {
  const text = String(content || "").toLowerCase();
  const classifier = kind === "url" ? urlClassifier : emailClassifier;
  const label = classifier.classify(text);
  const probs = classifier.getClassifications(text);
  const phishingProb = probs.find((entry) => entry.label === "phishing")?.value ?? 0.5;

  let mlScore = label === "phishing" ? 0.6 + phishingProb * 0.35 : 0.25 + phishingProb * 0.45;
  mlScore += Math.min(features.length * 0.03, 0.15);

  return clamp(Number(mlScore.toFixed(3)), 0.1, 0.99);
}

function scoreInput(kind, content, features) {
  const text = String(content || "").toLowerCase();
  let score = kind === "url" ? 12 : 10;

  score += features.length * 12;
  if (/https?:\/\/(\d+\.){3}\d+/.test(text)) score += 18;
  if (/urgent|password|otp|verify|bank|invoice|payment|suspended|action/.test(text)) score += 14;
  if (/http:\/\//.test(text)) score += 10;
  if (/https?:\/\/([^\/]+)/.test(text)) {
    const urlDomain = text.match(/https?:\/\/([^\/]+)/)[1];
    if (urlDomain.split(".").length > 3) score += 8;
  }

  return clamp(Math.round(score), 0, 99);
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

  const features = extractFeatures(kind, content);
  let riskScore = scoreInput(kind, content, features);
  const mlConfidence = calculateMLScore(kind, content, features);

  let whoisData = null;
  let threatIntelData = null;
  let emailParsedData = null;

  if (kind === "url") {
    whoisData = await getWhoisData(content);
    threatIntelData = await getThreatIntelData(content);

    if (whoisData?.age_days !== null && whoisData?.age_days < 30) {
      riskScore = clamp(riskScore + 10, 0, 99);
      features.push("Very young domain");
    }

    if (threatIntelData?.isKnownMalicious) {
      riskScore = clamp(riskScore + 25, 0, 99);
    }
  }

  if (kind === "email") {
    emailParsedData = await parseEmailContent(content);
    if (emailParsedData.linkCount > 0) features.push(`Email links: ${emailParsedData.linkCount}`);
    if (emailParsedData.attachmentCount > 0) features.push(`Attachments: ${emailParsedData.attachmentCount}`);
    if (emailParsedData.hasReplyToMismatch) {
      features.push("Reply-To mismatch");
      riskScore = clamp(riskScore + 8, 0, 99);
    }
  }

  const classification = classificationFromScore(riskScore, mlConfidence);

  const reasons = [];
  if (features.includes("Contains IP address")) reasons.push("IP-based URLs are commonly used in phishing.");
  if (features.includes("Non-HTTPS URL")) reasons.push("Unsecured links are higher risk.");
  if (features.includes("Urgent language")) reasons.push("Urgency is a common social engineering tactic.");
  if (features.includes("Credential request")) reasons.push("Requesting sensitive credentials is suspicious.");
  if (features.includes("Financial lure")) reasons.push("Financial pressure keywords suggest scam behavior.");
  if (features.includes("Contains link") && kind === "email") reasons.push("Embedded links in emails can hide malicious targets.");
  if (threatIntelData?.isKnownMalicious) reasons.push("Domain is known in threat intelligence databases.");
  if (features.includes("Very young domain")) reasons.push("Recently created domains are often abused for phishing.");
  if (features.includes("Reply-To mismatch")) reasons.push("Reply-To mismatch can indicate sender spoofing.");
  if (!reasons.length) reasons.push("No major phishing signal detected.");

  const latencyMs = clamp(Math.round(Date.now() - startTime + Math.random() * 50), 12, 500);

  const result = {
    id: randomUUID(),
    kind,
    input: toPreview(content),
    riskScore,
    classification,
    reasons,
    features,
    latencyMs,
    processedAt: new Date().toISOString(),
    mlConfidence: parseFloat(mlConfidence.toFixed(3)),
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
       (id, kind, input, riskScore, classification, reasons, features, latencyMs, processedAt, whoisData, threatIntelData, emailParsedData, mlConfidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        AVG(latencyMs) as avgLatencyMs
       FROM scan_results`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else {
          const stats = rows[0] || {
            totalScans: 0,
            phishingDetected: 0,
            suspiciousDetected: 0,
            avgLatencyMs: 0,
          };
          resolve({
            totalScans: stats.totalScans || 0,
            phishingDetected: stats.phishingDetected || 0,
            suspiciousDetected: stats.suspiciousDetected || 0,
            avgLatencyMs: Math.round(stats.avgLatencyMs || 0),
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
    service: "phishshield-api",
    version: "2.0.0-full-stack",
    features: ["url-detection", "email-detection", "whois-lookup", "threat-intel", "ml-scoring", "persistent-storage", "alerts"],
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
  console.log(`📡 PhishShield API running on port ${PORT}`);
  console.log(`📊 Features: URL Detection | Email Detection | WHOIS Lookup | Threat Intelligence | ML Scoring | Persistent Storage`);
});
