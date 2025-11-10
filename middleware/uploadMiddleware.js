// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Ensure these folders exist: 'public/uploads/images' and 'public/uploads/videos'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/';
    if (file.fieldname === 'posterImage' || file.fieldname === 'backdropImage') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'videoFile') {
      uploadPath += 'videos/';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
module.exports = upload;