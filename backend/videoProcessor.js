const axios = require('axios');
const cheerio = require('cheerio');
const summaryUtils = require('./utils/summaryGenerator');

async function getYoutubeVideoInfo(videoId) {
  try {
    // Fetch the video page
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 'Untitled';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';

    // Generate summary and extract additional information
    const summary = generateSummary(description);
    const categories = detectCategories(description);
    const keywords = extractKeywords(description);

    return {
      title,
      description,
      thumbnail,
      summary,
      categories,
      keywords,
      type: 'youtube',
      id: videoId
    };
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    return {
      title: 'Title unavailable',
      summary: 'Unable to generate summary',
      error: error.message
    };
  }
}

async function getVimeoVideoInfo(videoId) {
  try {
    // Fetch the video page
    const response = await axios.get(`https://vimeo.com/${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 'Untitled';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';

    // Generate summary and extract additional information
    const summary = generateSummary(description);
    const categories = detectCategories(description);
    const keywords = extractKeywords(description);

    return {
      title,
      description,
      thumbnail,
      summary,
      categories,
      keywords,
      type: 'vimeo',
      id: videoId
    };
  } catch (error) {
    console.error('Error fetching Vimeo video info:', error);
    return {
      title: 'Title unavailable',
      summary: 'Unable to generate summary',
      error: error.message
    };
  }
}

function generateSummary(description) {
  // Basic summary generation from description
  // You can enhance this with more sophisticated NLP techniques
  if (!description) return 'No description available';
  
  // Split into sentences and take the first few
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const summary = sentences.slice(0, 3).join('. ');
  
  return summary.length > 0 ? summary + '.' : 'No summary available';
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

module.exports = {
  getYoutubeVideoInfo,
  getVimeoVideoInfo
};