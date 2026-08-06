import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // login or register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!username || !password) {
        setError("Please enter username and password");
        setLoading(false);
        return;
      }

      const res = await axios.post("http://localhost:3001/api/auth/login", {
        username,
        password
      });

      console.log("✓ Login successful");
      setSuccess("Login successful! Redirecting...");
      setUsername("");
      setPassword("");

      // Redirect to app after 1 second
      setTimeout(() => {
        onLoginSuccess(res.data.username);
      }, 1000);
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!username || !password || !confirmPassword) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (username.length < 3) {
        setError("Username must be at least 3 characters");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const res = await axios.post("http://localhost:3001/api/auth/register", {
        username,
        password
      });

      console.log("✓ Registration successful");
      setSuccess("Registration successful! Please login now.");
      setMode("login");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Registration error:", err.message);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>✨ InsightForge AI</h1>
          <p className="login-subtitle">Powered Knowledge Extraction Platform</p>
        </div>

        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            🔐 Login
          </button>
          <button
            className={`mode-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
          >
            ✨ Register
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">👤 Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">🔑 Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "🔄 Logging in..." : "🚀 Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-username">👤 Username</label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                disabled={loading}
              />
              <span className="hint">Min 3 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">🔑 Password</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                disabled={loading}
              />
              <span className="hint">Min 6 characters</span>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">✓ Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "🔄 Creating account..." : "✨ Register"}
            </button>
          </form>
        )}

        {error && <div className="error-message">❌ {error}</div>}
        {success && <div className="success-message">✓ {success}</div>}

        <div className="login-footer">
          <p>
            {mode === "login"
              ? "Don't have an account? Click 'Register' above"
              : "Already have an account? Click 'Login' above"}
          </p>
        </div>
      </div>
    </div>
  );
}
