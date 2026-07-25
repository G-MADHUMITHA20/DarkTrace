import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IconShield, IconGlobe, IconMail, IconAlertTriangle, IconBarChart } from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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
            <h1>Join the vanguard of cybersecurity.</h1>
            <p>Create an account to access powerful threat detection tools and real-time intelligence feeds.</p>
            
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
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join DarkTrace to secure your digital footprint</p>
          
          {error && (
            <div className="auth-error">
              <IconAlertTriangle /> {error}
            </div>
          )}
          {success && (
            <div className="auth-success">
              <IconShield /> {success}
            </div>
          )}
          
          <form onSubmit={handleSignup}>
            <div className="auth-field">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe" 
                required 
              />
            </div>
            
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
            
            <div className="auth-field">
              <label>Confirm Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <div className="spinner" /> : "Create Account"}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
