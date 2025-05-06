const Movie = require('../models/Movie');
const { generateSecureUrl } = require('../middlewares/secureVideo');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
exports.getMovies = async (req, res) => {
  try {
    const { genre, year, sort, limit = 20, page = 1, search } = req.query;
    
    // Build query
    const query = {};
    
    // Add search filters
    if (genre) {
      query.genres = genre;
    }
    
    if (year) {
      query.year = year;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort) {
      // Handle sort format like "field:direction"
      const [field, direction] = sort.split(':');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
    } else {
      // Default sort
      sortOptions = { createdAt: -1 };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const totalMovies = await Movie.countDocuments(query);
    const movies = await Movie
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: movies.length,
      total: totalMovies,
      page: parseInt(page),
      pages: Math.ceil(totalMovies / parseInt(limit)),
      data: movies
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured movies
// @route   GET /api/movies/featured
// @access  Public
exports.getFeaturedMovies = async (req, res) => {
  try {
    const featuredMovies = await Movie.find({ isFeatured: true });
    
    res.status(200).json({
      success: true,
      count: featuredMovies.length,
      data: featuredMovies
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single movie
// @route   GET /api/movies/:id
// @access  Public
exports.getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    // Increment view count
    movie.viewCount += 1;
    await movie.save();
    
    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error(error);
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create a movie
// @route   POST /api/movies
// @access  Private/Admin
exports.createMovie = async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    
    res.status(201).json({
      success: true,
      data: movie
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

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: movie
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
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get movie statistics
// @route   GET /api/movies/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    // Total movies count
    const totalMovies = await Movie.countDocuments();
    
    // Featured movies count
    const featuredCount = await Movie.countDocuments({ isFeatured: true });
    
    // Movies by genre
    const genreCounts = await Movie.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    
    // Most viewed movies
    const mostViewed = await Movie.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title poster year viewCount');
    
    // Latest additions
    const latestAdditions = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title poster year createdAt');
    
    res.status(200).json({
      success: true,
      data: {
        total: totalMovies,
        featured: featuredCount,
        byGenre: genreCounts,
        mostViewed,
        latestAdditions
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

// @desc    Increment movie view count
// @route   POST /api/movies/:id/view
// @access  Public
exports.incrementViewCount = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    // Increment view count
    movie.viewCount += 1;
    await movie.save();
    
    res.status(200).json({
      success: true,
      data: {
        _id: movie._id,
        title: movie.title,
        viewCount: movie.viewCount
      }
    });
  } catch (error) {
    console.error(error);
    
    // Handle invalid ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all movie categories (genres)
// @route   GET /api/movies/categories
// @access  Public
exports.getCategories = async (req, res) => {  

  try {
    // Aggregate to get unique genres across all movies
    const categories = await Movie.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres' } },
      { $project: { name: '$_id', _id: 0 } },
      { $sort: { name: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: error.message
    });
  }
};

// @desc    Get related categories or subcategories based on req params
// @route   GET /api/movies/categories/:category
// @access  Public
exports.getSubcategories = async (req, res) => {
  try {
    const { category } = req.params;
    const { related = false, limit = 5 } = req.query;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }
    
    let query = {};
    let result = [];
    
    if (related === 'true' || related === true) {
      // Find movies that have this category
      query = { genres: category };
      
      // Find other categories that frequently appear with the requested category
      result = await Movie.aggregate([
        { $match: query },
        { $unwind: '$genres' },
        { $match: { genres: { $ne: category } } }, // Exclude the requested category
        { $group: { 
          _id: '$genres', 
          count: { $sum: 1 },
          movies: { $push: { title: '$title', id: '$_id' } }
        }},
        { $project: { 
          name: '$_id', 
          count: 1,
          movies: { $slice: ['$movies', parseInt(limit)] },
          _id: 0 
        }},
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);
    } else {
      // Get movies in this category with their specific subcategories/tags
      // Return complete movie data to display in UI
      const moviesInCategory = await Movie.find({ genres: category })
        .limit(parseInt(limit))
        .select('_id title year genres poster backdrop rating duration overview viewCount type isFeatured');
      
      result = {
        category,
        movies: moviesInCategory
      };
    }
    
    res.status(200).json({
      success: true,
      category,
      count: Array.isArray(result) ? result.length : (result.movies ? result.movies.length : 0),
      data: result
    });
  } catch (error) {
    console.error('Error in getSubcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategories',
      error: error.message
    });
  }
};

// @desc    Get a secure video URL for a movie
// @route   GET /api/movies/:id/secure-video
// @access  Private (requires authentication)
exports.getSecureVideoUrl = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    // Check if movie has a video URL
    if (!movie.videoUrl) {
      return res.status(404).json({
        success: false,
        message: 'No video available for this movie'
      });
    }
    
    // Generate a secure URL with a 1-hour expiry
    const secureUrlData = generateSecureUrl(
      movie._id.toString(),
      movie.videoUrl
    );
    
    res.status(200).json({
      success: true,
      data: {
        secureUrl: secureUrlData.secureUrl,
        expiresAt: secureUrlData.expiresAt
      }
    });
  } catch (error) {
    console.error('Error generating secure video URL:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 