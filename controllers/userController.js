const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Don't allow password updates through this route
    if (req.body.password) {
      delete req.body.password;
    }
    
    // Don't allow role changes through this route (only admins can change roles)
    if (req.body.role) {
      delete req.body.role;
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user role (admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    // Validate role
    if (!req.body.role || !['user', 'admin'].includes(req.body.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update role
    user.role = req.body.role;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.countDocuments();
    
    // Admin users count
    const adminsCount = await User.countDocuments({ role: 'admin' });
    
    // Users with largest watchlists
    const topWatchlists = await User.aggregate([
      {
        $project: {
          username: 1,
          email: 1,
          profilePic: 1,
          watchlistCount: { $size: { $ifNull: ['$watchlist', []] } },
          createdAt: 1
        }
      },
      { $sort: { watchlistCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Recently active users (using updatedAt as proxy for activity)
    const recentlyActive = await User.find()
      .select('username email profilePic updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    
    // Add lastActive field based on updatedAt
    const recentlyActiveWithLastActive = recentlyActive.map(user => ({
      ...user,
      lastActive: user.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        admins: adminsCount,
        topWatchlists,
        recentlyActive: recentlyActiveWithLastActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle movie in watchlist
// @route   POST /api/users/watchlist/:movieId
// @access  Private
exports.toggleWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const movieId = req.params.movieId;
    
    // Check if movie is already in watchlist
    const index = user.watchlist.indexOf(movieId);
    
    if (index !== -1) {
      // Remove from watchlist
      user.watchlist.splice(index, 1);
    } else {
      // Add to watchlist
      user.watchlist.push(movieId);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle movie in watched list
// @route   POST /api/users/watched/:movieId
// @access  Private
exports.toggleWatched = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const movieId = req.params.movieId;
    
    // Check if movie is already in watched list
    const index = user.watched.indexOf(movieId);
    
    if (index !== -1) {
      // Remove from watched list
      user.watched.splice(index, 1);
    } else {
      // Add to watched list
      user.watched.push(movieId);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      watched: user.watched
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 