const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateProfile,
  changePassword,
  toggleWatchlist,
  toggleWatched,
  updateRole,
  getStats
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middlewares/auth');

// Admin only routes
router.get('/', protect, isAdmin, getUsers);
router.get('/stats', protect, isAdmin, getStats);
router.get('/:id', protect, isAdmin, getUser);
router.put('/:id/role', protect, isAdmin, updateRole);

// User routes (protected)
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/watchlist/:movieId', protect, toggleWatchlist);
router.post('/watched/:movieId', protect, toggleWatched);

module.exports = router; 