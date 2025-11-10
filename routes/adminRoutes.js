// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

// Import all the new file names
const adminController = require('../controllers/adminController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');
const upload = require('../Middleware/uploadMiddleware.js');

// Route to GET the admin page
router.get(
  '/add-content', 
  isAuthenticated, // Check if logged in
  isAdmin,         // Check if admin
  adminController.getAddContentPage
);

// Route to POST the form data
router.post(
  '/add-content',
  isAuthenticated,
  isAdmin,
  // Multer middleware to handle the 3 files
  upload.fields([
    { name: 'posterImage', maxCount: 1 },
    { name: 'backdropImage', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 }
  ]),
  adminController.createContent // Finally, run the controller logic
);

module.exports = router;