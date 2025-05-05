const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Admin credentials
const ADMIN_EMAIL = 'admin@akflix.com';
const ADMIN_PASSWORD = 'admin123';

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '30d'
  });
};

// Ensure admin user exists in database
const ensureAdminExists = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    
    if (!adminExists) {
      console.log('Creating admin user in database');
      
      // Create admin user directly
      const newAdmin = new User({
        username: 'admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // This will be hashed by the pre-save hook
        profilePic: 'https://i.pravatar.cc/150?img=1',
        role: 'admin'
      });
      
      // Save the admin user
      await newAdmin.save();
      
      console.log('Admin user created successfully with ID:', newAdmin._id);
    } else {
      console.log('Admin user already exists in database with ID:', adminExists._id);
      
      // Update admin password to ensure it matches
      adminExists.password = ADMIN_PASSWORD;
      await adminExists.save();
      console.log('Admin password updated');
    }
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
  }
};

// Call function to ensure admin exists
ensureAdminExists();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, profilePic } = req.body;
    
    console.log('Registration attempt:', { username, email });
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    // Check if user with email or username already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      // Use provided profile pic or generate a random one
      profilePic: profilePic || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    });
    
    console.log('User created successfully:', { id: user._id, username: user.username });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      watchlist: user.watchlist || [],
      watched: user.watched || [],
      preferences: user.preferences || {}
    };
    
    res.status(201).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Special admin debug for this endpoint
    if (email === ADMIN_EMAIL) {
      console.log('Admin login attempt detected');
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('User found:', { id: user._id, username: user.username, role: user.role });
    
    // Check if password matches
    try {
      console.log('Comparing passwords...');
      const isMatch = await user.comparePassword(password);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('Login failed: Password mismatch for user:', user.username);
        
        // Special case for admin - if password doesn't match, update it
        if (email === ADMIN_EMAIL) {
          console.log('Updating admin password');
          user.password = ADMIN_PASSWORD;
          await user.save();
          console.log('Admin password updated, retrying login');
          
          // Try one more time
          const secondMatch = await user.comparePassword(password);
          if (!secondMatch) {
            return res.status(401).json({
              success: false,
              message: 'Invalid credentials (admin retry failed)'
            });
          } else {
            console.log('Admin login successful after password update');
          }
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }
    } catch (passwordError) {
      console.error('Error comparing passwords:', passwordError);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
    
    console.log('Login successful for:', user.username);
    
    // Generate token
    const token = generateToken(user._id);
    
    // Return user data without password
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      watchlist: user.watchlist || [],
      watched: user.watched || [],
      preferences: user.preferences || {}
    };
    
    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is already set from the auth middleware
    const user = req.user;
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}; 