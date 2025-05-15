const multer = require('multer');
const path = require('path');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    // Generate a unique name using timestamp and original extension
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// File size limit (2MB)
const limits = {
  fileSize: 2 * 1024 * 1024 // 2MB in bytes
};

// Create the multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = {
  profileUpload: upload.single('profileImage')
}; 