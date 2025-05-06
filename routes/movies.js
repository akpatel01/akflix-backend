const express = require('express');
const router = express.Router();
const {
  getMovies,
  getFeaturedMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getStats,
  incrementViewCount,
  getCategories,
  getSubcategories
} = require('../controllers/movieController');
const { protect, isAdmin } = require('../middlewares/auth');

// Test route to check if API is responding
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Movies API is working',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.get('/', getMovies);
router.get('/featured', getFeaturedMovies);
router.get('/categories', getCategories);
router.get('/categories/:category', getSubcategories);
router.get('/stats', protect, getStats);
router.get('/:id', getMovie);
router.post('/:id/view', incrementViewCount);

// Admin only routes
router.post('/', protect, isAdmin, createMovie);
router.put('/:id', protect, isAdmin, updateMovie);
router.delete('/:id', protect, isAdmin, deleteMovie);

module.exports = router; 