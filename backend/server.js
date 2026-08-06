const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const { getYoutubeVideoInfo, getVimeoVideoInfo, extractVideoId } = require('./videoProcessor');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// DATABASE SETUP (Simple JSON-based)
// ============================================
const DB_DIR = './database';
const USERS_FILE = `${DB_DIR}/users.json`;
const HISTORY_FILE = `${DB_DIR}/history.json`;

// Initialize database directory
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize user database
function initializeDatabase() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({}, null, 2));
  }
}

initializeDatabase();

// User management functions
function getAllUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || {};
  } catch (err) {
    return {};
  }
}

function getUserHistory(username) {
  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || {};
    return history[username] || [];
  } catch (err) {
    return [];
  }
}

function saveUserHistory(username, historyEntry) {
  try {
    const allHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || {};
    if (!allHistory[username]) {
      allHistory[username] = [];
    }
    allHistory[username].push({
      ...historyEntry,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(allHistory, null, 2));
  } catch (err) {
    console.error("Error saving history:", err.message);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'application/pdf',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and text files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Function to process image using OCR
async function processImage(filePath) {
  try {
    console.log('Starting image processing:', filePath);
    
    // Ensure the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Upload file not found');
    }

    const processedPath = filePath + '_processed.jpg';
    
    // Optimize image for OCR
    console.log('Optimizing image...');
    await sharp(filePath)
      .resize(2000, undefined, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .normalize()
      .sharpen()
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(processedPath);

    console.log('Image optimized, starting OCR...');
    
    // Create Tesseract worker
    const worker = await createWorker({
      logger: progress => console.log('OCR Progress:', progress)
    });
    
    // Initialize worker with English
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Set OCR parameters for better accuracy
    await worker.setParameters({
      tessedit_pageseg_mode: '1',
      tessedit_ocr_engine_mode: '2',
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?@#$%&*()-+=:;" \''
    });

    // Perform OCR
    const { data: { text } } = await worker.recognize(processedPath);
    console.log('OCR completed, text length:', text.length);
    
    // Clean up
    await worker.terminate();
    try {
      fs.unlinkSync(processedPath);
    } catch (e) {
      console.error('Error cleaning up processed image:', e);
    }

    return text;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Image processing failed: ' + error.message);
  }
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const users = getAllUsers();
    
    if (users[username]) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create new user
    users[username] = {
      password: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`✓ User registered: ${username}`);
    
    res.json({ 
      message: "Registration successful",
      username 
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = getAllUsers();
    const user = users[username];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordHash = hashPassword(password);
    if (user.password !== passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`✓ User logged in: ${username}`);
    res.json({ 
      message: "Login successful",
      username,
      token: hashPassword(username + Date.now())
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/history/:username", (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const history = getUserHistory(username);
    res.json({ 
      username,
      history: history.slice().reverse() // Latest first
    });
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.delete("/api/history/:username", (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: "Username required" });
    }

    const allHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) || {};
    delete allHistory[username];
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(allHistory, null, 2));
    
    console.log(`✓ History cleared for: ${username}`);
    res.json({ message: "History cleared" });
  } catch (err) {
    console.error("Clear history error:", err.message);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// ============================================
// EXISTING ENDPOINTS (with history tracking)
// ============================================

app.post("/api/process", upload.single("file"), async (req, res) => {
  const { inputType, text, urls } = req.body;
  let context = "";

  try {
    if (inputType === "text") {
      context = text || "";
    } else if (inputType === "image" && req.file) {
      try {
        console.log("Processing image:", req.file.path);
        // Create uploads directory if it doesn't exist
        const uploadsDir = 'uploads';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        console.log("File received:", {
          filename: req.file.originalname,
          path: req.file.path,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        context = await processImage(req.file.path);
        console.log("Image processed successfully, extracted text length:", context.length);
        
        // Clean up the original file
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error("Error cleaning up original file:", e);
        }
      } catch (err) {
        console.error("Image processing error:", err);
        throw new Error("Failed to process image: " + err.message);
      }
    } else if (inputType === "urls") {
      console.log("Processing URLs:", urls);
      const urlList = JSON.parse(urls || "[]");
      console.log("Parsed URL list:", urlList);
        
      const contents = await Promise.all(
        urlList.map(async (url) => {
          try {
            console.log("Fetching URL:", url);
            const r = await axios.get(url, { 
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            console.log("Successfully fetched URL:", url);
            // Very crude HTML -> text
            const text = r.data.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
                         .replace(/<[^>]+>/g, " ")
                         .replace(/\s+/g, " ")
                         .trim();
            console.log(`Processed text length for ${url}:`, text.length);
            return text;
          } catch (err) {
            console.error("Failed fetching", url, {
              message: err.message,
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data
            });
            return "";
          }
        })
      );
      context = contents.join("\n\n");
      console.log("Final combined context length:", context.length);
    } else if (req.file) {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      context = pdfData.text || "";
      fs.unlinkSync(req.file.path);
    }

    res.json({ context });
  } catch (err) {
    console.error("Process error:", err);
    // Clean up any uploaded files
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        if (fs.existsSync(req.file.path + '_processed.jpg')) {
          fs.unlinkSync(req.file.path + '_processed.jpg');
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
    res.status(500).json({ 
      error: "Failed to process input",
      details: err.message 
    });
  }
});

app.post("/api/ask", async (req, res) => {
  const { model, question, context, targetLanguage, username } = req.body;

  try {
    console.log("Received request:", { 
      username,
      model, 
      question,
      questionLength: question?.length, 
      contextLength: context?.length 
    });
    
    if (!context || context.length === 0) {
      console.log("Warning: Empty context received");
      return res.status(400).json({ error: "No content processed yet. Please process some content first." });
    }

    if (!question || question.trim().length === 0) {
      console.log("Warning: Empty question received");
      return res.status(400).json({ error: "Please enter a question" });
    }

    // Ollama local API
    const payload = {
      model: model || "phi3:mini",
      prompt: `Based on the following content, please answer this question: "${question}"\n\nContent: ${context}`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 1000,
        // Add special options for multimodal models
        ...(model === 'llava' || model === 'bakllava' ? {
          multimodal: true,
          image_format: 'jpeg'
        } : {})
      }
    };

    console.log("Sending request to Ollama with model:", payload.model, "prompt length:", payload.prompt.length);
    
    const r = await axios.post("http://localhost:11434/api/generate", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000
    });

    console.log("Received response from Ollama");
    
    // Ollama's response shape may vary; attempt to extract text safely
    const answer = (r.data && (r.data.output || r.data.response || r.data.text)) || JSON.stringify(r.data);
    console.log("Processed answer length:", answer?.length);
    
    // Save to history if username provided
    if (username) {
      saveUserHistory(username, {
        question,
        answer: answer.substring(0, 500), // Save first 500 chars to keep file size manageable
        model,
        language: targetLanguage || 'en',
        contextLength: context.length
      });
      console.log(`✓ Search saved to history for user: ${username}`);
    }
    
    res.json({ answer });
  } catch (err) {
    console.error("Ollama request failed:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    res.status(500).json({ error: "Ollama request failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
// Video information endpoint
app.post("/api/video-info", async (req, res) => {
  const { url } = req.body;
  
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    const videoInfo = url.toLowerCase().includes('vimeo.com') 
      ? await getVimeoVideoInfo(videoId)
      : await getYoutubeVideoInfo(videoId);

    res.json(videoInfo);
  } catch (error) {
    console.error('Error processing video URL:', error);
    res.status(500).json({
      error: 'Failed to process video URL',
      details: error.message
    });
  }
});

// Translation service using free APIs
async function translateText(text, targetLanguage) {
  if (!text || targetLanguage === 'en') {
    return text;
  }

  console.log(`🌐 Starting translation to ${targetLanguage}...`);

  try {
    // Try using MyMemory Translation API first (reliable for Hindi & Telugu)
    const encodedText = encodeURIComponent(text);
    console.log(`Trying MyMemory API for ${targetLanguage}...`);
    
    const response = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLanguage}`,
      { timeout: 10000 }
    );

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const translatedText = response.data.responseData.translatedText;
      if (translatedText && translatedText.toLowerCase() !== 'null' && translatedText.trim() !== text.trim()) {
        console.log(`✓ Translation to ${targetLanguage} successful via MyMemory API`);
        return translatedText;
      }
    }
  } catch (err) {
    console.log(`⚠️ MyMemory API failed for ${targetLanguage}:`, err.message);
  }

  try {
    // Backup: Try Google Translate API
    console.log(`Trying Google Translate API for ${targetLanguage}...`);
    const encodedText = encodeURIComponent(text);
    
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLanguage}&dt=t&q=${encodedText}`,
      { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (response.data && response.data[0] && Array.isArray(response.data[0])) {
      const translatedText = response.data[0].map(item => (Array.isArray(item) ? item[0] : item)).join('');
      if (translatedText && translatedText.trim()) {
        console.log(`✓ Translation to ${targetLanguage} successful via Google Translate`);
        return translatedText;
      }
    }
  } catch (err) {
    console.log(`⚠️ Google Translate API failed for ${targetLanguage}:`, err.message);
  }

  try {
    // Last backup: Use LibreTranslate API (free, open-source)
    console.log(`Trying LibreTranslate API for ${targetLanguage}...`);
    const response = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'en',
        target: targetLanguage
      },
      { timeout: 10000 }
    );

    if (response.data && response.data.translatedText) {
      console.log(`✓ Translation to ${targetLanguage} successful via LibreTranslate API`);
      return response.data.translatedText;
    }
  } catch (err) {
    console.log(`⚠️ LibreTranslate API failed for ${targetLanguage}:`, err.message);
  }

  // Return original text if all services fail
  console.log(`ℹ️ All translation services unavailable for ${targetLanguage}, returning original text`);
  return text;
}

app.post("/api/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  
  try {
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Missing text or target language" });
    }

    console.log(`🌐 Translating to ${targetLanguage}...`);
    
    const translatedText = await translateText(text, targetLanguage);
    
    console.log(`✓ Translation completed`);
    res.json({ translatedText });
  } catch (err) {
    console.error("❌ Translation error:", err.message);
    // Fallback: return original text
    res.json({ 
      translatedText: text,
      warning: "Translation service unavailable"
    });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));