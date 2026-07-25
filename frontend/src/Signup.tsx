import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconShield } from "./icons";

export default function Signup({ onLogin }: { onLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };

  const strength = getPasswordStrength();
  const strengthColors = ["var(--border)", "var(--danger)", "var(--warning)", "var(--success)"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("You must accept the terms and conditions.");
      return;
    }
    
    // Simulate successful signup and login
    onLogin();
    navigate("/dashboard");
  };

  const handleSocialSignup = (provider: string) => {
    onLogin();
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", color: "var(--primary)", marginBottom: "0.5rem" }}>
            <IconShield />
          </div>
          <h1 className="auth-title" style={{ fontSize: "1.3rem" }}>Create an Account</h1>
          <p className="auth-subtitle">Join DarkTrace for advanced security</p>
        </div>

        {error && (
          <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.25rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSignup} style={{ gap: "1rem" }}>
          <div className="auth-input-group">
            <label className="auth-label">Full Name</label>
            <input 
              type="text" 
              className="auth-input" 
              placeholder="John Doe" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input 
              type="email" 
              className="auth-input" 
              placeholder="you@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <div style={{ flex: 1, display: "flex", gap: "0.25rem" }}>
                  <div style={{ height: "4px", flex: 1, background: strength >= 1 ? strengthColors[strength] : "var(--border)", borderRadius: "2px" }} />
                  <div style={{ height: "4px", flex: 1, background: strength >= 2 ? strengthColors[strength] : "var(--border)", borderRadius: "2px" }} />
                  <div style={{ height: "4px", flex: 1, background: strength >= 3 ? strengthColors[strength] : "var(--border)", borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: strengthColors[strength], fontWeight: 600, width: "40px", textAlign: "right" }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirm Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              className="auth-input" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
            <input type="checkbox" id="terms" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ cursor: "pointer" }} />
            <label htmlFor="terms" style={{ fontSize: "0.8rem", color: "var(--text)", cursor: "pointer" }}>
              I agree to the <Link to="#" className="auth-link">Terms</Link> and <Link to="#" className="auth-link">Privacy Policy</Link>
            </label>
          </div>

          <button type="submit" className="auth-btn">Create Account</button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-sso">
          <button className="auth-sso-btn" onClick={() => handleSocialSignup("Google")}>
            Continue with Google
          </button>
          <button className="auth-sso-btn" onClick={() => handleSocialSignup("GitHub")}>
            Continue with GitHub
          </button>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
