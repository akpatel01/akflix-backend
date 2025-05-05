const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Movie description is required']
    },
    year: {
      type: Number,
      required: [true, 'Release year is required']
    },
    duration: {
      type: String,
      required: [true, 'Duration is required']
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required']
    },
    director: {
      type: String
    },
    actors: {
      type: [String],
      default: []
    },
    poster: {
      type: String,
      required: [true, 'Poster URL is required']
    },
    backdrop: {
      type: String,
      required: [true, 'Backdrop URL is required']
    },
    videoUrl: {
      type: String
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['movie', 'tv-show'],
      default: 'movie'
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Text index for search functionality
movieSchema.index({ title: 'text', description: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie; 