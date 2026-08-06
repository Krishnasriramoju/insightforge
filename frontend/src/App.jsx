import React, { useState, useEffect } from "react";
import UploadSection from "./components/UploadSection";
import ModelSelector from "./components/ModelSelector";
import ChatBox from "./components/ChatBox";
import Login from "./components/Login";
import History from "./components/History";

export default function App() {
  const [username, setUsername] = useState(null);
  const [currentView, setCurrentView] = useState("search"); // search or history
  const [model, setModel] = useState("phi3:mini");
  const [context, setContext] = useState("");
  const [inputType, setInputType] = useState("text");

  // Check if user is already logged in on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setUsername(user);
    localStorage.setItem("username", user);
    setCurrentView("search");
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem("username");
    setCurrentView("search");
  };

  // Show login screen if not authenticated
  if (!username) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main app if authenticated
  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>✨ InsightForge AI</h1>
          <p className="subtitle">
            Powered Knowledge Extraction Platform
          </p>
        </div>

        <div className="header-right">
          <div className="nav-buttons">
            <button
              className={`nav-btn ${currentView === "search" ? "active" : ""}`}
              onClick={() => setCurrentView("search")}
            >
              🔍 Search
            </button>
            <button
              className={`nav-btn ${currentView === "history" ? "active" : ""}`}
              onClick={() => setCurrentView("history")}
            >
              📚 History
            </button>
          </div>

          <div className="user-info">
            <span className="username">👤 {username}</span>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {currentView === "search" ? (
          <>
            <div className="panel">
              <UploadSection onProcessed={setContext} onInputTypeChange={setInputType} />
              <ModelSelector selected={model} onSelect={setModel} inputType={inputType} />
            </div>
            <ChatBox model={model} context={context} username={username} inputType={inputType} />
          </>
        ) : (
          <History username={username} />
        )}
      </main>
    </div>
  );
}