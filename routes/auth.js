const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { profileUpload } = require('../middlewares/upload');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Upload profile image route
router.post('/upload-profile-image', profileUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
});

// Create admin user with custom credentials - protected by setup key
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, setupKey } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Validate setup key
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Invalid setup key. Admin creation not authorized.'
      });
    }
    
    // Check if user with email or username already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      // If user exists but is not admin, make them admin
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        existingUser.password = password; // Will be hashed by middleware
        await existingUser.save();
        
        return res.status(200).json({
          success: true,
          message: `User ${username} has been upgraded to admin`,
        });
      }
      
      // If admin already exists, update their details
      existingUser.username = username;
      existingUser.password = password; // Will be hashed by middleware
      await existingUser.save();
      
      return res.status(200).json({
        success: true,
        message: 'Admin user updated successfully',
      });
    }
    
    // Create new admin user
    const adminUser = new User({
      username,
      email,
      password,  // Will be hashed by pre-save hook
      profilePic: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      role: 'admin'
    });
    
    await adminUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Special admin setup route for troubleshooting (keeping for backward compatibility)
router.get('/setup-admin', async (req, res) => {
  try {
    // Admin credentials
    const adminEmail = 'admin@akflix.com';
    const adminPassword = 'admin123';
    
    // Check if admin user already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('Admin exists, updating password');
      
      // Set admin password
      adminUser.password = adminPassword;
      await adminUser.save();
      
      return res.status(200).json({
        success: true,
        message: 'Admin user updated successfully',
        email: adminEmail,
        password: adminPassword
      });
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    adminUser = new User({
      username: 'admin',
      email: adminEmail,
      password: adminPassword,  // Will be hashed by pre-save hook
      profilePic: 'https://i.pravatar.cc/150?img=1',
      role: 'admin'
    });
    
    await adminUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      email: adminEmail,
      password: adminPassword
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 