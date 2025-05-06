const express = require('express');
const router = express.Router();
const { verifySecureUrl } = require('../middlewares/secureVideo');
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');
const url = require('url');

// Stream a video using a secure token
router.get('/stream', verifySecureUrl, async (req, res) => {
  const { videoUrl } = req.secureVideo;
  
  try {
    const parsedUrl = url.parse(videoUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'Range': req.headers.range || 'bytes=0-'
      }
    };
    
    // Create the appropriate request based on protocol
    const protocol = isHttps ? https : http;
    
    // Handle streaming of video
    const proxyReq = protocol.request(options, (proxyRes) => {
      // Set appropriate headers
      res.status(proxyRes.statusCode);
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // Pipe the video stream to the response
      proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
      console.error('Error streaming video:', error);
      res.status(500).json({
        success: false,
        message: 'Error streaming video'
      });
    });
    
    // End the request
    proxyReq.end();
  } catch (error) {
    console.error('Error handling video stream:', error);
    res.status(500).json({
      success: false,
      message: 'Error streaming video'
    });
  }
});

module.exports = router; 