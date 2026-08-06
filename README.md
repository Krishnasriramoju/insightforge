✨ InsightForge AI - Powered Knowledge Extraction Platform
===========================================================

This package contains InsightForge AI - an advanced knowledge extraction platform:
- backend (Express) that integrates with a local Ollama instance
- frontend (Vite + React) UI

## Prerequisites

- Node.js (16+)
- Ollama running locally (https://ollama.ai) and accessible at http://localhost:11434

## Setup

### Backend
```
cd backend
npm install
npm start
```

The backend will run on http://localhost:3001

### Frontend
```
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

## How it works

1. Use the Upload/Enter area to paste text, provide URLs (one per line) or upload a PDF.
2. Press Process to extract combined context that will be sent to the model.
3. Select an Ollama model (must exist in your local Ollama).
4. Ask a question and press Search to send the prompt to Ollama via the backend.

Note: The HTML-to-text extraction is intentionally simple and may not extract clean text from all websites. For production use, replace the extractor with a robust HTML parsing/cleaning tool.