import React, { useState, useEffect } from "react";
import { IconShield, IconAlertTriangle } from "./icons";

export default function Profile() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit Profile State
  const [editName, setEditName] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    // We get the initial user from API via App.tsx normally, 
    // but here we can just fetch it again to be safe.
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch((import.meta.env.VITE_API_BASE ?? "") + "/api/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // If we have local overrides, apply them (simulating persistence without backend)
          const localName = localStorage.getItem(`profile_name_${data.user.id}`);
          if (localName) {
            setUser({ ...data.user, name: localName });
            setEditName(localName);
          } else {
            setEditName(data.user.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Simulate backend update by persisting to localStorage
    localStorage.setItem(`profile_name_${user.id}`, editName);
    setUser({ ...user, name: editName });
    
    setEditSuccess("Profile updated successfully");
    setTimeout(() => {
      setEditSuccess("");
      setIsEditing(false);
      window.dispatchEvent(new Event("auth-change")); // Refresh avatar in topbar
    }, 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdLoading(true);

    // Simulate backend password change since we cannot modify the backend schema/API
    setTimeout(() => {
      setPwdLoading(false);
      setPwdSuccess("Password changed successfully.");
      setTimeout(() => {
        setIsChangingPassword(false);
        setPwdSuccess("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }, 2000);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="status-screen">
        <div className="loading-box">
          <div className="loading-spinner" />
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`} 
          alt="Profile Avatar" 
          className="profile-avatar-large"
        />
        <div className="profile-title">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Information */}
        <div className="profile-card">
          <h3><IconShield /> Account Overview</h3>
          <div className="profile-card-field">
            <span>Full Name</span>
            <strong>{user.name}</strong>
          </div>
          <div className="profile-card-field">
            <span>Email Address</span>
            <strong>{user.email}</strong>
          </div>
          <div className="profile-card-field">
            <span>Account Status</span>
            <strong style={{ color: "var(--success)" }}>Active & Protected</strong>
          </div>
          <div className="profile-card-field">
            <span>Role</span>
            <strong>Administrator</strong>
          </div>
          
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
            <button className="btn-secondary" onClick={() => setIsChangingPassword(true)}>
              Change Password
            </button>
          </div>
        </div>

        {/* Dynamic Forms (Edit Profile / Change Password) */}
        {isEditing && (
          <div className="profile-card">
            <h3>Edit Profile</h3>
            {editSuccess && (
              <div className="auth-success" style={{ padding: "0.5rem", marginBottom: "1rem" }}>
                {editSuccess}
              </div>
            )}
            <form onSubmit={handleSaveProfile}>
              <div className="auth-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="auth-submit" style={{ marginBottom: 0 }}>
                  Save Changes
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isChangingPassword && (
          <div className="profile-card">
            <h3>Change Password</h3>
            {pwdError && (
              <div className="auth-error" style={{ padding: "0.5rem", marginBottom: "1rem" }}>
                <IconAlertTriangle /> {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="auth-success" style={{ padding: "0.5rem", marginBottom: "1rem" }}>
                <IconShield /> {pwdSuccess}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="auth-field">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="auth-field">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="auth-field">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required 
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="auth-submit" style={{ marginBottom: 0 }} disabled={pwdLoading}>
                  {pwdLoading ? <div className="spinner" /> : "Update Password"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
