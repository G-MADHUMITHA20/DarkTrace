const EXTENSION_FEATURES = [
  "Analyze active browser URL from popup",
  "Analyze pasted email/message content",
  "Highlight suspicious links on loaded pages",
  "Background service worker for scan actions",
  "Connected to PhishShield API on localhost:4000",
];

const INSTALL_STEPS = [
  "Open Chrome and go to chrome://extensions",
  "Enable Developer mode",
  "Click Load unpacked",
  "Select the browser-extension folder from the project root",
  "Pin PhishShield extension and start scanning from the popup",
];

export default function ExtensionCenter() {
  return (
    <section className="extension-shell">
      <header className="extension-hero card">
        <p className="eyebrow">Browser Security Module</p>
        <h2>Extension Center</h2>
        <p className="subcopy">
          The extension is already implemented and connected to your backend. This section helps you install,
          verify, and demo it during project review.
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
