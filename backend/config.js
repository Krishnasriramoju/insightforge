require('dotenv').config();

module.exports = {
    youtube: {
        apiKey: process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY',
        baseUrl: 'https://www.googleapis.com/youtube/v3'
    },
    vimeo: {
        accessToken: process.env.VIMEO_ACCESS_TOKEN || 'YOUR_VIMEO_ACCESS_TOKEN',
        baseUrl: 'https://api.vimeo.com'
    }
};