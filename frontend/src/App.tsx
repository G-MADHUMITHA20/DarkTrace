import { useEffect, useState, useRef } from "react";
import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import type { AppState, BootstrapResponse } from "./types";
import Dashboard from "./Dashboard";
import ExtensionCenter from "./ExtensionCenter";
import UrlScanner from "./UrlScanner";
import EmailScanner from "./EmailScanner";
import History from "./History";
import Reports from "./Reports";
import ThreatIntelligence from "./ThreatIntelligence";
import Settings from "./Settings";
import {
  IconShield, IconGlobe, IconMail, IconGrid,
  IconClock, IconAlertTriangle, IconBarChart,
  IconSettings, IconSearch, IconBell, IconMoon
} from "./icons";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your security posture and threat activity" },
  "/url-scanner": { title: "URL Scanner", subtitle: "Analyze URLs with AI-powered threat intelligence" },
  "/email-scanner": { title: "Email Scanner", subtitle: "Analyze emails with AI-powered threat intelligence" },
  "/history": { title: "Detection History", subtitle: "Review past scans and threat detections" },
  "/threat-intelligence": { title: "Threat Intelligence", subtitle: "Global threat feeds and indicators of compromise" },
  "/reports": { title: "Reports", subtitle: "Generate and export security metrics" },
  "/settings": { title: "Settings", subtitle: "Configure platform preferences and rules" },
  "/extension": { title: "Extension Center", subtitle: "Browser security module installation and management" },
};

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: <IconGrid /> },
  { path: "/url-scanner", label: "URL Scanner", icon: <IconGlobe /> },
  { path: "/email-scanner", label: "Email Scanner", icon: <IconMail /> },
  { path: "/history", label: "Detection History", icon: <IconClock /> },
  { path: "/threat-intelligence", label: "Threat Intelligence", icon: <IconAlertTriangle /> },
  { path: "/reports", label: "Reports", icon: <IconBarChart /> },
  { path: "/settings", label: "Settings", icon: <IconSettings /> },
];

import Login from "./Login";
import Signup from "./Signup";

// --- Protected Route Component ---
function ProtectedRoute({ isAuthenticated, children }: { isAuthenticated: boolean; children: JSX.Element }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [showNotif, setShowNotif] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("auth"));
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleLogin = () => {
    localStorage.setItem("auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchState = async () => {
    if (!isAuthenticated) return;
    try {
      const latest = await requestJson<AppState>("/api/state");
      setState(latest);
    } catch {
      console.error("Backend polling failed.");
    }
  };

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const response = await requestJson<BootstrapResponse>("/api/bootstrap");
        if (mounted) setState(response.state);
      } catch {
        console.error("Unable to connect to backend API.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    bootstrap();
    
    let poll: number | undefined;
    if (isAuthenticated) {
      poll = window.setInterval(fetchState, 5000);
    }
    return () => { 
      mounted = false; 
      if (poll) window.clearInterval(poll); 
    };
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="status-screen">
        <div className="loading-box">
          <div className="loading-spinner" />
          <p className="loading-text">Initializing DarkTrace...</p>
        </div>
      </div>
    );
  }

  // Define the authenticated layout
  const AuthenticatedLayout = () => {
    const currentRouteInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES["/dashboard"];
    return (
      <div className="app-shell">
        {/* ---- SIDEBAR ---- */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <IconShield />
            </div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">DarkTrace</span>
              <span className="sidebar-logo-sub">Cybersecurity Intelligence</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item, idx) => (
              <div key={idx}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="sidebar-user" onClick={handleLogout} style={{ cursor: "pointer", borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "auto" }}>
            <div className="user-avatar">J</div>
            <div className="user-info">
              <p className="user-name">John Admin</p>
              <p className="user-role">Sign Out</p>
            </div>
          </div>
        </aside>

        {/* ---- MAIN AREA ---- */}
        <div className="main-area">
          <header className="topbar">
            <div className="topbar-title-group">
              <h1 className="topbar-title">{currentRouteInfo.title}</h1>
              <p className="topbar-subtitle">{currentRouteInfo.subtitle}</p>
            </div>

            <div className="topbar-search">
              <IconSearch />
              <input placeholder="Search anything..." />
            </div>

            <div className="topbar-actions">
              <div className="notif-wrapper" ref={notifRef}>
                <button 
                  className="topbar-icon-btn" 
                  title="Notifications"
                  onClick={() => setShowNotif(!showNotif)}
                >
                  <IconBell />
                  {(state?.summary?.phishingDetected ?? 0) > 0 && <span className="notif-dot" />}
                </button>
                
                {showNotif && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span className="notif-title">Notifications</span>
                      <button className="notif-clear-btn" onClick={() => setShowNotif(false)}>Mark all as read</button>
                    </div>
                    <div className="notif-body">
                      <div className="notif-item unread">
                        <div className="notif-icon critical"><IconAlertTriangle /></div>
                        <div className="notif-content">
                          <p className="notif-heading">Threat detected</p>
                          <p className="notif-desc">High risk phishing URL blocked</p>
                          <p className="notif-time">2 mins ago</p>
                        </div>
                      </div>
                      <div className="notif-item">
                        <div className="notif-icon warning"><IconMail /></div>
                        <div className="notif-content">
                          <p className="notif-heading">Email flagged</p>
                          <p className="notif-desc">Suspicious sender detected in inbox</p>
                          <p className="notif-time">1 hour ago</p>
                        </div>
                      </div>
                      <div className="notif-item">
                        <div className="notif-icon success"><IconShield /></div>
                        <div className="notif-content">
                          <p className="notif-heading">Recent scan completed</p>
                          <p className="notif-desc">System check finished with 0 errors</p>
                          <p className="notif-time">3 hours ago</p>
                        </div>
                      </div>
                      <div className="notif-item">
                        <div className="notif-icon info"><IconBarChart /></div>
                        <div className="notif-content">
                          <p className="notif-heading">New report generated</p>
                          <p className="notif-desc">Weekly security summary available</p>
                          <p className="notif-time">Yesterday</p>
                        </div>
                      </div>
                    </div>
                    <div className="notif-footer">
                      <button className="notif-view-all">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>
              
              <button className="topbar-icon-btn" title="Theme Toggle" onClick={toggleTheme}>
                <IconMoon />
              </button>
              <div className="topbar-avatar" title="Sign Out" onClick={handleLogout} style={{ cursor: "pointer" }}>J</div>
            </div>
          </header>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/url-scanner" element={<UrlScanner onStateUpdate={fetchState} />} />
              <Route path="/email-scanner" element={<EmailScanner onStateUpdate={fetchState} />} />
              <Route path="/history" element={<History />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/extension" element={<ExtensionCenter />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup onLogin={handleLogin} />} />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
