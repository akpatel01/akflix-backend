const crypto = require('crypto');

/**
 * Simple middleware for generating secure video URLs
 */
const secureVideo = {
  /**
   * Generates a signed URL for video access
   * @param {string} videoId - The ID of the video
   * @param {string} videoUrl - The actual URL of the video
   * @param {number} expiresIn - Time in seconds until URL expiration (default: 1 hour)
   * @returns {object} - Object containing the secure URL and expiration timestamp
   */
  generateSecureUrl: (videoId, videoUrl, expiresIn = 3600) => {
    // Create an expiration timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    // Create a payload with video ID, URL, and expiration
    const payload = {
      videoId,
      videoUrl,
      expiresAt
    };
    
    // Convert payload to string
    const payloadString = JSON.stringify(payload);
    
    // Create a signature using HMAC
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(payloadString)
      .digest('hex');
    
    // Create a token by combining the payload and signature
    const token = Buffer.from(`${payloadString}|${signature}`).toString('base64');
    
    return {
      secureUrl: `/api/videos/stream?token=${token}`,
      expiresAt
    };
  },
  
  /**
   * Verifies a secure video URL token
   * @param {string} token - The token to verify
   * @returns {object|null} - Decoded payload if valid, null if invalid
   */
  verifyToken: (token) => {
    try {
      // Decode the token
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      
      // Split the token into parts
      const [payloadString, signature] = decoded.split('|');
      
      if (!payloadString || !signature) {
        return null;
      }
      
      // Verify the signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(payloadString)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return null;
      }
      
      // Parse the payload
      const payload = JSON.parse(payloadString);
      
      // Check if the URL has expired
      if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  },
  
  /**
   * Middleware to verify a secure video URL
   */
  verifySecureUrl: (req, res, next) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No token provided'
      });
    }
    
    const payload = secureVideo.verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: Invalid or expired token'
      });
    }
    
    // Add video info to request for later use
    req.secureVideo = payload;
    next();
  }
};

module.exports = secureVideo; 