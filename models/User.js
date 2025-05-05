const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    profilePic: {
      type: String,
      default: 'https://i.pravatar.cc/150?img=1',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie'
      }
    ],
    watched: [
      {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie'
      }
    ],
    preferences: {
      favGenres: [String],
      recommendationSettings: {
        type: String,
        enum: ['all', 'similar', 'personalized'],
        default: 'all',
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('Hashing password for user:', this.username);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords for user:', this.username);
    console.log('Stored hashed password length:', this.password?.length);
    
    if (!this.password) {
      console.error('No password stored for user!');
      return false;
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User; 