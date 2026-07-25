import { useState, useEffect } from "react";
import { IconBell, IconShieldCheck, IconSettings, IconAlertTriangle, IconMoon } from "./icons";

export default function Settings() {
  const [strictness, setStrictness] = useState("medium");
  const [autoBlock, setAutoBlock] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T000/B000/XXX");
  const [isSaved, setIsSaved] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.25rem" }}>Platform Settings</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Configure heuristics, blocking rules, and preferences.</p>
        </div>
        <button className="export-btn" onClick={handleSave} style={{ background: isSaved ? "var(--success)" : "var(--primary)" }}>
          {isSaved ? "Settings Saved" : "Save Changes"}
        </button>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.25rem" }}>
        
        {/* Security Rules */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.25rem", fontSize: "1rem" }}>
            <IconShieldCheck /> Security Rules
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Heuristic Strictness Level</label>
              <select 
                value={strictness} 
                onChange={(e) => setStrictness(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", outline: "none", fontSize: "0.85rem" }}
              >
                <option value="low">Low (Fewer false positives)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Maximum security)</option>
                <option value="paranoid">Paranoid (Blocks unverified domains)</option>
              </select>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Auto-block High Risk Threats</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Automatically sinkhole requests to URLs with risk score &gt; 75</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={autoBlock} onChange={(e) => setAutoBlock(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.25rem", fontSize: "1rem" }}>
            <IconBell /> External Notifications
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Email Critical Alerts</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Send an email to admin when a Critical threat is blocked.</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Slack Webhook URL</label>
              <input 
                type="text" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", outline: "none", fontSize: "0.85rem" }}
                placeholder="https://hooks.slack.com/..."
              />
            </div>
          </div>
        </div>

        {/* Threat Detection */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.25rem", fontSize: "1rem" }}>
            <IconAlertTriangle /> Threat Detection
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>ML Confidence Threshold</label>
              <select 
                defaultValue="standard"
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", outline: "none", fontSize: "0.85rem" }}
              >
                <option value="permissive">Permissive (&gt; 50%)</option>
                <option value="standard">Standard (&gt; 75%)</option>
                <option value="strict">Strict (&gt; 90%)</option>
              </select>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Enable Real-time WHOIS</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Query live WHOIS for domain age analysis</p>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.25rem", fontSize: "1rem" }}>
            <IconMoon /> Theme Preferences
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Dark Mode</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Enable high-contrast dark theme</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={theme === "dark"} onChange={(e) => setTheme(e.target.checked ? "dark" : "light")} />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>Compact UI</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Reduce spacing in data tables</p>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked={false} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border); transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(20px); }
        .slider.round { border-radius: 24px; }
        .slider.round:before { border-radius: 50%; }
      `}</style>
    </div>
  );
}
