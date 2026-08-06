# InsightForge AI

InsightForge AI is a full-stack knowledge extraction platform that helps users upload documents, images, text, and URLs, then ask questions against the extracted context using a local Ollama model.

## Features

- Upload images, PDFs, and text files
- Extract text from images using OCR
- Accept pasted text or website URLs as context sources
- Query extracted content through a chat interface
- Store user login and chat history locally
- Switch between different Ollama models

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- OCR: Tesseract.js
- Image processing: Sharp
- Parsing: cheerio, pdf-parse, natural

## Project Structure

- backend/ - Express server, OCR processing, authentication, and file handling
- frontend/ - React app for the user interface
- uploads/ - Uploaded files and processed assets

## Prerequisites

- Node.js 16+
- Ollama installed and running locally at http://localhost:11434
- At least one Ollama model available locally (for example, phi3:mini)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Krishnasriramoju/insightforge.git
   cd insightforge
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

## Running the App

### Start the backend
```bash
cd backend
npm start
```

The backend will run on http://localhost:3001.

### Start the frontend
```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually http://localhost:5173.

## Usage

1. Register or log in.
2. Choose an input type such as text, URL, or file upload.
3. Upload or enter the source content.
4. Select an Ollama model.
5. Ask questions about the processed context.

## Notes

- The backend uses local JSON files for simple user and history storage.
- OCR accuracy depends on image quality and the selected model.
- For production use, consider replacing the simple local storage with a proper database and adding authentication improvements.

## License

This project is for demonstration and learning purposes.