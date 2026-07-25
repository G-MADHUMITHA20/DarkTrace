import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconShield } from "./icons";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    // Simulate login success
    onLogin();
    navigate("/dashboard");
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    onLogin();
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", color: "var(--primary)", marginBottom: "1rem" }}>
            <IconShield />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in to your DarkTrace dashboard</p>
        </div>

        {error && (
          <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.25rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="auth-label">Password</label>
              <Link to="#" className="auth-link" style={{ fontSize: "0.8rem" }}>Forgot Password?</Link>
            </div>
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" id="remember" style={{ cursor: "pointer" }} />
            <label htmlFor="remember" style={{ fontSize: "0.85rem", color: "var(--text)", cursor: "pointer" }}>Remember me</label>
          </div>

          <button type="submit" className="auth-btn">Sign In</button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-sso">
          <button className="auth-sso-btn" onClick={() => handleSocialLogin("Google")}>
            Continue with Google
          </button>
          <button className="auth-sso-btn" onClick={() => handleSocialLogin("GitHub")}>
            Continue with GitHub
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
