import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UploadSection.css";

export default function UploadSection({ onProcessed, onInputTypeChange }) {
  const [text, setText] = useState("");
  const [urls, setUrls] = useState("");
  const [inputType, setInputType] = useState("text");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlInfo, setUrlInfo] = useState([]);
  const [videoSummaries, setVideoSummaries] = useState({});

  const extractUrlInfo = (url) => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        const videoId = hostname.includes('youtu.be') 
          ? parsedUrl.pathname.slice(1)
          : parsedUrl.searchParams.get('v');
        return { type: 'youtube', id: videoId, url, isVideo: true };
      }
      
      // Vimeo
      else if (hostname.includes('vimeo.com')) {
        const videoId = parsedUrl.pathname.split('/').pop();
        return { type: 'vimeo', id: videoId, url, isVideo: true };
      }
      
      // Medium
      else if (hostname.includes('medium.com')) {
        const path = parsedUrl.pathname.split('/');
        const slug = path[path.length - 1];
        return { type: 'medium', slug, url };
      }
      
      // GitHub
      else if (hostname.includes('github.com')) {
        const [, owner, repo, ...rest] = parsedUrl.pathname.split('/').filter(Boolean);
        return { 
          type: 'github',
          owner,
          repo,
          subPath: rest.join('/'),
          url
        };
      }
      
      // Twitter/X
      else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        const path = parsedUrl.pathname.split('/');
        const tweetId = path[path.length - 1];
        const username = path[1];
        return { type: 'twitter', username, tweetId, url };
      }
      
      // Default for other URLs
      return { type: 'generic', url };
    } catch (err) {
      console.error("Invalid URL:", url);
      return { type: 'invalid', url };
    }
  };

  const handleProcess = async () => {
    setLoading(true);
    try {
      if (inputType === "text") {
        const res = await axios.post("http://localhost:3001/api/process", { inputType: "text", text });
        onProcessed(res.data.context || "");
      } else if (inputType === "urls") {
        const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
        const processedUrls = urlList.map(extractUrlInfo);
        setUrlInfo(processedUrls);
        
        // Process video URLs first to get summaries
        const videoUrls = processedUrls.filter(info => info.isVideo);
        const videoSummaryPromises = videoUrls.map(async (info) => {
          try {
            const res = await axios.post("http://localhost:3001/api/video-info", {
              url: info.url,
              type: info.type,
              videoId: info.id
            });
            return {
              id: info.id,
              ...res.data
            };
          } catch (err) {
            console.error(`Failed to fetch video info for ${info.url}:`, err);
            return {
              id: info.id,
              error: "Failed to fetch video information"
            };
          }
        });

        const videoResults = await Promise.all(videoSummaryPromises);
        const newVideoSummaries = {};
        videoResults.forEach(result => {
          if (result && result.id) {
            newVideoSummaries[result.id] = result;
          }
        });
        setVideoSummaries(newVideoSummaries);

        // Send all URL information to the backend
        const res = await axios.post("http://localhost:3001/api/process", { 
          inputType: "urls", 
          urls: JSON.stringify(urlList),
          urlInfo: JSON.stringify(processedUrls),
          videoSummaries: JSON.stringify(newVideoSummaries)
        });
        onProcessed(res.data.context || "");
      } else if (inputType === "file" && file) {
        console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);
        
        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size must be less than 10MB");
        }
        
        const form = new FormData();
        form.append("file", file);
        form.append("inputType", inputType);
        
        const res = await axios.post("http://localhost:3001/api/process", form, { 
          headers: { 
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log("Upload progress:", percentCompleted + "%");
          }
        });
        onProcessed(res.data.context || "");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process input. See console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card upload-section upload-${inputType}`}>
      <h3>📤 Upload / Enter</h3>
      <div className="controls">
        <label className={inputType === "text" ? "active-mode" : ""}>
          <input type="radio" checked={inputType==="text"} onChange={()=>{setInputType("text"); onInputTypeChange("text");}} value="text" /> 
          <span>📝 Enter Text</span>
        </label>
        <label className={inputType === "urls" ? "active-mode" : ""}>
          <input type="radio" checked={inputType==="urls"} onChange={()=>{setInputType("urls"); onInputTypeChange("urls");}} value="urls" /> 
          <span>🔗 URLs</span>
        </label>
        <label className={inputType === "file" ? "active-mode" : ""}>
          <input type="radio" checked={inputType==="file"} onChange={()=>{setInputType("file"); onInputTypeChange("file");}} value="file" /> 
          <span>📄 PDF/TXT</span>
        </label>
      </div>

      {inputType === "text" && (
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your article or text content here..." rows={6}></textarea>
      )}

      {inputType === "urls" && (
        <div>
          <textarea 
            value={urls} 
            onChange={e => {
              setUrls(e.target.value);
              const urlList = e.target.value.split("\n").map(u => u.trim()).filter(Boolean);
              setUrlInfo(urlList.map(extractUrlInfo));
            }} 
            placeholder="One URL per line" 
            rows={4}
          ></textarea>
          {urlInfo.length > 0 && (
            <div className="url-info">
              {urlInfo.map((info, index) => (
                <div key={index} className={`url-item ${info.type}`}>
                  <strong>{info.type.charAt(0).toUpperCase() + info.type.slice(1)}:</strong>
                  {info.type === 'youtube' && (
                    <div className="video-info">
                      <div>Video ID: {info.id}</div>
                      {videoSummaries[info.id] && (
                        <div className="video-details">
                          <div className="video-title">{videoSummaries[info.id].title}</div>
                          {videoSummaries[info.id].summary && (
                            <div className="video-summary">
                              <strong>Summary:</strong> {videoSummaries[info.id].summary}
                            </div>
                          )}
                          {videoSummaries[info.id].duration && (
                            <div>Duration: {videoSummaries[info.id].duration}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {info.type === 'vimeo' && (
                    <div className="video-info">
                      <div>Video ID: {info.id}</div>
                      {videoSummaries[info.id] && (
                        <div className="video-details">
                          <div className="video-title">{videoSummaries[info.id].title}</div>
                          {videoSummaries[info.id].summary && (
                            <div className="video-summary">
                              <strong>Summary:</strong> {videoSummaries[info.id].summary}
                            </div>
                          )}
                          {videoSummaries[info.id].duration && (
                            <div>Duration: {videoSummaries[info.id].duration}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {info.type === 'medium' && ` Article: ${info.slug}`}
                  {info.type === 'github' && ` ${info.owner}/${info.repo}${info.subPath ? '/' + info.subPath : ''}`}
                  {info.type === 'twitter' && ` @${info.username} - Tweet: ${info.tweetId}`}
                  {info.type === 'invalid' && ` Invalid URL`}
                  {info.type === 'generic' && ` Standard webpage`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {inputType === "file" && (
        <div className="file-upload-container">
          <input 
            type="file" 
            onChange={e=>setFile(e.target.files[0])} 
            accept=".pdf,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff"
            id="file-input"
          />
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '12px' }}>📄 Supported: PDF, TXT, JPG, PNG, GIF, BMP, TIFF (Max 10MB)</p>
          {file && <p style={{ color: 'var(--blue)', marginTop: '8px', fontWeight: '600' }}>✓ Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</p>}
        </div>
      )}

      <button onClick={handleProcess} disabled={loading}>{loading ? "⏳ Processing..." : "✨ Process"}</button>
    </div>
  );
}