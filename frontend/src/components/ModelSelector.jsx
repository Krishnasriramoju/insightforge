import React from "react";
import "./ModelSelector.css";

export default function ModelSelector({ selected, onSelect, inputType = "text" }) {
  const models = [
    "llava",
    "bakllava",
    "yi:6b",
    "deepseek-coder:6.7b",
    "phi3:mini",
    "gemma:2b",
    "tinyllama:1.1b",
    "llama3.2:1b",
    "mistral:latest"
  ];

  return (
    <div className={`card model-selector model-${inputType}`}>
      <h3>🤖 Select Model</h3>
      <select value={selected} onChange={e=>onSelect(e.target.value)}>
        {models.map(m=> <option value={m} key={m}>{m}</option>)}
      </select>
      <p className="muted">💡 Choose a model available in your local Ollama instance. Ensure Ollama is running at http://localhost:11434</p>
    </div>
  );
}
