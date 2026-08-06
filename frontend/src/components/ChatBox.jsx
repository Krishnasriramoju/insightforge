import React, { useState } from "react";
import axios from "axios";
import "./ChatBox.css";

export default function ChatBox({ model, context, username, inputType = "text" }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);
  
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "te", name: "Telugu" }
  ];

  const handleTranslate = async (text, targetLang) => {
    try {
      console.log("🌐 Starting translation to:", targetLang);
      setTranslationStatus(`Translating to ${languages.find(l => l.code === targetLang)?.name || targetLang}...`);
      
      const res = await axios.post("http://localhost:3001/api/translate", {
        text,
        targetLanguage: targetLang
      }, {
        timeout: 30000 // 30 second timeout for translation
      });
      
      console.log("✓ Translation response received");
      setTranslationStatus("");
      
      if (!res.data.translatedText) {
        console.warn("No translated text in response");
        setTranslationStatus("Translation incomplete");
        return text;
      }
      
      return res.data.translatedText;
    } catch (err) {
      console.error("❌ Translation failed:", err.message);
      setTranslationStatus(`Translation error: ${err.message}`);
      setTimeout(() => setTranslationStatus(""), 5000);
      return text;
    }
  };

  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    
    if (answer && langCode !== "en") {
      setTranslating(true);
      const translatedAnswer = await handleTranslate(answer, langCode);
      setAnswer(translatedAnswer);
      setTranslating(false);
    } else if (langCode === "en") {
      setTranslationStatus("");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setTranslationStatus("");
    try {
      console.log("📝 Sending question to backend...");
      const res = await axios.post("http://localhost:3001/api/ask", { 
        model, 
        question, 
        context,
        username,
        targetLanguage: selectedLanguage 
      }, {
        timeout: 60000
      });
      
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      
      let finalAnswer = res.data.answer || "";
      console.log("✓ Response received from Ollama");
      
      if (selectedLanguage !== "en") {
        console.log("🌐 Response requires translation");
        finalAnswer = await handleTranslate(finalAnswer, selectedLanguage);
      }
      
      setAnswer(finalAnswer);
    } catch (err) {
      console.error("❌ Error:", err.message);
      setAnswer("⚠️ Error: " + (err.response?.data?.error || err.message || "Failed to get answer. Make sure Ollama is running at http://localhost:11434"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat chat-${inputType}`}>
      <h2>💬 Ask a Question</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-12px', marginBottom: '16px' }}>
        Based on the content you've provided, ask specific questions to get AI-powered insights.
      </p>
      <div className="ask-row">
        <input 
          value={question} 
          onChange={e=>setQuestion(e.target.value)} 
          placeholder="What would you like to know about the content?" 
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleAsk()}
        />
        <button onClick={handleAsk} disabled={loading}>{loading ? "🔄 Thinking..." : "🔍 Search"}</button>
      </div>

      <div className="answer-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: 0 }}>📝 Answer</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {answer ? '✓ Response ready' : '◯ Waiting for query'}
          </span>
        </div>
        <div className="answer-header">
          <div className="language-selector">
            <label htmlFor="lang-select" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>
              🌐 Language:
            </label>
            <select 
              id="lang-select"
              value={selectedLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={translating}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(answer);
              setCopyStatus(true);
              setTimeout(() => setCopyStatus(false), 2000);
            }}
            disabled={!answer || translating}
          >
            {copyStatus ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        {translationStatus && (
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--blue)', 
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: 'rgba(31, 111, 235, 0.1)',
            borderRadius: '4px',
            borderLeft: '3px solid var(--blue)'
          }}>
            🌐 {translationStatus}
          </div>
        )}
        <div className="answer-content" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {answer || "🔄 No answer yet. Process content and ask a question to get started."}
        </div>
      </div>
    </div>
  );
}