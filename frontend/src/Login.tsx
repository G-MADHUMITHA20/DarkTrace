import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IconShield, IconGlobe, IconMail, IconAlertTriangle, IconBarChart } from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      window.dispatchEvent(new Event("auth-change"));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <IconShield /> DarkTrace
          </div>
          
          <div className="auth-feature-list">
            <h1>Secure your digital footprint.</h1>
            <p>Experience the next generation of AI-powered threat detection and cybersecurity intelligence.</p>
            
            <div className="feature-item">
              <IconShield /> AI Threat Detection
            </div>
            <div className="feature-item">
              <IconGlobe /> URL Scanner
            </div>
            <div className="feature-item">
              <IconMail /> Email Scanner
            </div>
            <div className="feature-item">
              <IconAlertTriangle /> Threat Intelligence
            </div>
            <div className="feature-item">
              <IconBarChart /> Secure Reports
            </div>
          </div>
        </div>
      </div>
      
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-brand-mobile">
            <IconShield /> <h2>DarkTrace</h2>
          </div>
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to your account to continue</p>
          
          {error && (
            <div className="auth-error">
              <IconAlertTriangle /> {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required 
              />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            
            <div className="auth-actions">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => alert("Password reset instructions have been sent to your email (mock).")}
              >
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <div className="spinner" /> : "Log in"}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
