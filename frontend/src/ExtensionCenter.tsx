const EXTENSION_FEATURES = [
  "Analyze active browser URL from popup",
  "Analyze pasted email/message content",
  "Warning popup for phishing sites with risk score & explanation",
  "Go Back button to exit dangerous pages instantly",
  "Highlight suspicious links on loaded pages",
  "ML classifier with confidence scoring",
  "Background service worker for real-time scan actions",
  "Connected to DarkTrace API on localhost:4000",
];

const INSTALL_STEPS = [
  "Open Chrome and go to chrome://extensions",
  "Enable Developer mode (top-right toggle)",
  "Click 'Load unpacked'",
  "Select the browser-extension folder from the project root",
  "Pin DarkTrace extension to toolbar",
  "Click the extension icon on any page to start scanning",
];

const IMPLEMENTED_FILES = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "background.js",
  "content.js",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  );
}

export default function ExtensionCenter() {
  return (
    <div className="ext-page">
      {/* Header card */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IconPuzzle />
        </div>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.25rem" }}>Extension Center</h2>
          <p style={{ fontSize: "0.84rem", color: "#64748B", lineHeight: "1.6" }}>
            The DarkTrace browser extension is fully implemented and connected to the backend API.
            It provides real-time phishing detection with warning popups, risk scores, AI explanations,
            and a Go Back button for immediate protection.
          </p>
        </div>
      </div>

      <div className="ext-grid">
        {/* Features card */}
        <div className="ext-card">
          <h3 className="ext-card-title">What It Supports</h3>
          <div className="ext-feature-list">
            {EXTENSION_FEATURES.map((item) => (
              <div key={item} className="ext-feature-item">
                <span className="ext-check"><IconCheck /></span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Install steps card */}
        <div className="ext-card">
          <h3 className="ext-card-title">Installation Guide</h3>
          <div className="ext-step-list">
            {INSTALL_STEPS.map((item, idx) => (
              <div key={item} className="ext-step-item">
                <span className="ext-step-num">{idx + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Files card */}
      <div className="ext-files-card">
        <h3 className="ext-card-title">Implemented Files</h3>
        <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "0.85rem" }}>
          All extension files are located in the <code style={{ background: "#F1F5F9", padding: "0.15rem 0.35rem", borderRadius: 4, fontSize: "0.78rem" }}>browser-extension/</code> directory.
        </p>
        <div className="ext-files-grid">
          {IMPLEMENTED_FILES.map((f) => (
            <div key={f} className="ext-file-chip">browser-extension/{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
