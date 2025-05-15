const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Define environment variables directly
const PORT = 5000;
const MONGO_URI = "mongodb+srv://akflix:7EfjJXOKAo1JCuOw@akflix.dm8a6co.mongodb.net/?retryWrites=true&w=majority&appName=akflix";
const JWT_SECRET = "akflix-super-secret-jwt-key";
const JWT_EXPIRY = "30d"; // 30 days expiry for JWT tokens
const ADMIN_SETUP_KEY = "akflix-secret-setup-key-2023"; // Key required to create admin users

// Debug environment variables
console.log('Environment variables:');
console.log('PORT:', PORT);
console.log('MONGO_URI exists:', !!MONGO_URI);
console.log('JWT_SECRET exists:', !!JWT_SECRET);
console.log('JWT_EXPIRY:', JWT_EXPIRY);
console.log('ADMIN_SETUP_KEY exists:', !!ADMIN_SETUP_KEY);

// Export variables to be used by other files
process.env.PORT = PORT;
process.env.MONGO_URI = MONGO_URI;
process.env.JWT_SECRET = JWT_SECRET;
process.env.JWT_EXPIRY = JWT_EXPIRY;
process.env.ADMIN_SETUP_KEY = ADMIN_SETUP_KEY;

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function to log responses
  res.send = function(data) {
    console.log(`Response for ${req.method} ${req.originalUrl}:`, typeof data === 'string' ? data.substring(0, 100) : 'Non-string response');
    return originalSend.apply(res, arguments);
  };
  
  // Store the original json function
  const originalJson = res.json;
  
  // Override the json function to log responses
  res.json = function(data) {
    console.log(`Response for ${req.method} ${req.originalUrl}:`, JSON.stringify(data).substring(0, 200));
    return originalJson.apply(res, arguments);
  };
  
  next();
});

// Import routes
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('AKFLIX API is running');
});

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 