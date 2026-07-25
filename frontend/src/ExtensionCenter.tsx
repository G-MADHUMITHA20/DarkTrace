const EXTENSION_FEATURES = [
  "🔍 Analyze active browser URL from popup",
  "📧 Analyze pasted email/message content",
  "🚨 Warning popup for phishing sites with risk score & explanation",
  "↩️ Go Back button to exit dangerous pages instantly",
  "🔗 Highlight suspicious links on loaded pages",
  "🤖 ML classifier with confidence scoring",
  "⚡ Background service worker for real-time scan actions",
  "📡 Connected to DarkTrace API on localhost:4000",
];

const INSTALL_STEPS = [
  "Open Chrome and go to chrome://extensions",
  "Enable Developer mode (top-right toggle)",
  "Click 'Load unpacked'",
  "Select the browser-extension folder from the project root",
  "Pin DarkTrace extension to toolbar",
  "Click the extension icon on any page to start scanning",
];

export default function ExtensionCenter() {
  return (
    <section className="extension-shell">
      <header className="extension-hero card">
        <p className="eyebrow">Browser Security Module</p>
        <h2>Extension Center</h2>
        <p className="subcopy">
          The DarkTrace extension is fully implemented and connected to the backend API. It provides real-time phishing 
          detection with warning popups, risk scores, AI explanations, and a Go Back button for immediate protection.
        </p>
      </header>

      <div className="extension-grid">
        <article className="card extension-card">
          <h3>What It Supports</h3>
          <ul className="fancy-list">
            {EXTENSION_FEATURES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="card extension-card">
          <h3>Install Flow</h3>
          <ol className="install-list">
            {INSTALL_STEPS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </div>

      <article className="card extension-paths">
        <h3>Implemented Files</h3>
        <div className="path-grid">
          <p>browser-extension/manifest.json</p>
          <p>browser-extension/popup.html</p>
          <p>browser-extension/popup.js</p>
          <p>browser-extension/background.js</p>
          <p>browser-extension/content.js</p>
          <p>browser-extension/icons/icon16.png</p>
          <p>browser-extension/icons/icon48.png</p>
          <p>browser-extension/icons/icon128.png</p>
        </div>
      </article>
    </section>
  );
}
