import React, { useState, useEffect } from "react";
import axios from "axios";
import "./History.css";

export default function History({ username }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [username]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:3001/api/history/${username}`
      );
      setHistory(res.data.history || []);
      setError("");
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-content">
          <h1>📚 Search History</h1>
          <p className="header-subtitle">
            Your past searches and responses
          </p>
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No searches yet</h2>
          <p>Your search history will appear here after you perform a search.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <div
                className="history-item-header"
                onClick={() => toggleExpanded(index)}
              >
                <div className="history-question">
                  <span className="question-number">#{history.length - index}</span>
                  <span className="question-text">{item.question}</span>
                </div>
                <div className="history-meta">
                  <span className="model-badge">{item.model}</span>
                  <span className="date-badge">{formatDate(item.timestamp)}</span>
                  <span className={`expand-icon ${expanded === index ? "open" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expanded === index && (
                <div className="history-item-content">
                  <div className="answer-section">
                    <h4>Answer:</h4>
                    <p>{item.answer}</p>
                  </div>
                  <div className="meta-section">
                    <div className="meta-item">
                      <span className="meta-label">Language:</span>
                      <span className="meta-value">{item.language.toUpperCase()}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Context Length:</span>
                      <span className="meta-value">{item.contextLength} tokens</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
