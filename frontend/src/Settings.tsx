import { useState } from "react";
import { IconBell, IconShieldCheck } from "./icons";

export default function Settings() {
  const [strictness, setStrictness] = useState("medium");
  const [autoBlock, setAutoBlock] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T000/B000/XXX");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="page-wrapper">
      <div className="table-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div className="table-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="table-card-title">Platform Settings</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Configure heuristics, blocking rules, and notification endpoints.</p>
          </div>
          <button className="export-btn" onClick={handleSave} style={{ background: isSaved ? "var(--success)" : "var(--primary)" }}>
            {isSaved ? "Settings Saved" : "Save Changes"}
          </button>
        </div>
        
        <div style={{ padding: "2rem" }}>
          {/* Security Rules */}
          <div className="detail-section" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.5rem" }}>
              <IconShieldCheck /> Security Rules
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>Heuristic Strictness Level</label>
                <select 
                  value={strictness} 
                  onChange={(e) => setStrictness(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", outline: "none" }}
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
          <div className="detail-section">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)", marginBottom: "1.5rem" }}>
              <IconBell /> External Notifications
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", outline: "none" }}
                  placeholder="https://hooks.slack.com/..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
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
