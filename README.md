# DarkTrace

DarkTrace is a comprehensive, AI-powered cybersecurity platform designed to detect and block phishing attacks in real-time. It provides a multi-layered defense mechanism combining Machine Learning (ML) classification with deep heuristic analysis to evaluate URLs and emails for malicious intent.

---

## Problem Statement

Phishing attacks remain one of the most prevalent and damaging vectors for cybercrime. Modern phishing campaigns have evolved beyond simple credential harvesting, utilizing lookalike domains, sophisticated social engineering, and transient infrastructure to bypass traditional signature-based security filters. Organizations need an intelligent, dynamic detection system that can identify emerging threats before they compromise user data.

---

## Solution Overview

DarkTrace solves this by combining **Machine Learning (ML)** with **Heuristic Analysis**. Instead of relying purely on static blocklists, the platform dynamically analyzes the structural, behavioral, and contextual traits of incoming URLs and emails. By processing inputs through a lightweight Natural Language Processing (NLP) Bayesian classifier alongside deep heuristic checks (like WHOIS domain age, typosquatting detection, and external threat intelligence), DarkTrace delivers high-confidence threat detection with explainable AI feedback.

---

## Features

- **URL Scanner:** Analyzes URLs for malicious indicators, domain reputation, and structural anomalies.
- **Email Scanner:** Parses raw email headers and content to detect spoofing, urgent language, and suspicious attachments.
- **Browser Extension:** Allows users to scan active web pages or pasted email text directly from their browser.
- **AI Risk Scoring:** Computes an overall 0–100 risk score combining ML confidence and heuristic weights.
- **Heuristic Analysis:** Deep rule-based inspection of payloads.
- **Threat Intelligence:** Integrates with Abuse.ch URLhaus to verify known indicators of compromise (IoCs).
- **Detection History:** Searchable log of previous scans with detailed reports.
- **Reports:** Generate and export security reports in CSV/PDF.
- **Dashboard:** Real-time overview of security posture, alerts, and analytics.
- **Settings:** Configure heuristic strictness, auto-blocking, and webhook endpoints.
- **Explainable AI:** Human-readable explanations for every prediction.
- **Security Recommendations:** Actionable suggestions after every scan.

---

## Heuristic Detection

### URL Heuristics

- **Domain Age (WHOIS):** Detects newly registered domains.
- **HTTPS Verification:** Identifies insecure HTTP websites.
- **URL Length:** Flags unusually long URLs.
- **Redirect Analysis:** Detects URL shorteners and redirects.
- **Suspicious Characters:** Finds excessive hyphens, `@`, encoded text, etc.
- **Typosquatting Detection:** Detects lookalike domains.
- **Blacklist Lookup:** Checks URLs against URLhaus.
- **IP-based URLs:** Flags URLs using raw IP addresses.

### Email Heuristics

- Urgent Language Detection
- Credential Request Detection
- Financial Scam Detection
- Sender Spoofing Detection
- Suspicious Attachment Detection
- Embedded Link Detection

---

## Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Vite, React Router, Recharts, CSS |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Machine Learning | Natural (Naive Bayes Classifier) |
| Browser Extension | Manifest V3 |
| APIs | WHOIS, URLhaus |
| Libraries | Axios, Mailparser, Cors |

---

## System Architecture

```
                User
                  │
                  ▼
        React Dashboard / Browser Extension
                  │
                  ▼
            Express Backend API
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Heuristic Engine      ML Classifier
        │                   │
        └─────────┬─────────┘
                  ▼
          Risk Score Engine
                  │
                  ▼
         Threat Classification
                  │
                  ▼
        SQLite Database & Reports
```

---

## Project Structure

```text
DarkTrace/
│
├── backend/
│   ├── server.js
│   ├── phishshield.db
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── Dashboard.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles.css
│   └── package.json
│
├── browser-extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
│
└── README.md
```

---

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Running the Project

### Start Backend

```bash
cd backend
node server.js
```

Backend runs at:

```
http://localhost:4000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

### Browser Extension

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click **Load unpacked**
5. Select the `browser-extension` folder

---

## API Endpoints

| Method | Endpoint | Purpose |
|----------|-------------------------------|--------------------------------|
| GET | /api/health | API health |
| GET | /api/bootstrap | Dashboard data |
| GET | /api/state | Current system state |
| GET | /api/dashboard/history | Scan history |
| GET | /api/history/search | Search history |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/dashboard/alerts | Threat alerts |
| POST | /api/analyze | Analyze URL or Email |
| POST | /api/feedback | Submit ML feedback |

---

## Dashboard Modules

- Dashboard
- URL Scanner
- Email Scanner
- Detection History
- Threat Intelligence
- Reports
- Settings

---

## Detection Workflow

```
User Input
      │
      ▼
Feature Extraction
      │
      ▼
Heuristic Analysis
      │
      ▼
Machine Learning
      │
      ▼
Risk Score Generation
      │
      ▼
Threat Classification
      │
      ▼
AI Explanation
      │
      ▼
Security Recommendation
```

---

## Future Enhancements

- Implementation of a real-time WebSocket connection to push alerts directly to the frontend without polling.
- Transitioning the lightweight Bayesian classifier to a more robust Deep Learning model (e.g., TensorFlow.js or a Python microservice).
- Expanding the Threat Intelligence module to aggregate data from VirusTotal or AlienVault OTX.
- Supporting enterprise Single Sign-On (SSO) and Role-Based Access Control (RBAC).

---

## Contributors

- **Member 1:** Lead Backend Developer & ML Integration (API Design, Heuristics, Database)
- **Member 2:** Frontend Architect (React Dashboard, Recharts, State Management)
- **Member 3:** UI/UX Designer (Enterprise CSS, Responsive Layouts, Dark Mode)
- **Member 4:** Extension Developer & Threat Researcher (Browser Extension, WHOIS, Threat Intel Integration)

---

## License

This project is licensed under the **MIT License**.
