// middleware/uploadMiddleware.js
const multer = require("multer");

// 1. Configure multer to store files in memory (RAM) as Buffer objects
// instead of saving them directly to disk. This gives the controller
// access to the file data before deciding where/how to save it.
const storage = multer.memoryStorage();

// 2. Define a basic file filter to accept only images and videos.
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error('Invalid file type, only images and videos are allowed!'), false);
  }
};

// Create the multer upload instance with the defined storage and filter.
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter 
});

module.exports = upload;