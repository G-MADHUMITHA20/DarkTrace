import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IconShield } from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <IconShield />
          </div>
          <h1>DarkTrace</h1>
          <p>Cybersecurity Intelligence</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to your account to continue</p>
          
          {error && <div className="auth-error">{error}</div>}
          
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
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => alert("Forgot Password functionality is not available yet.")}
              >
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
