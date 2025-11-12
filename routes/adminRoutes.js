// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController.js');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/uploadMiddleware.js'); // This is our 'memoryStorage' multer

// Route to GET the admin page
router.get(
  '/add-content', 
  isAuthenticated, 
  isAdmin, 
  adminController.getAddContentPage
);

// Route to POST the form data (for CREATE)
router.post(
  '/add-content',
  isAuthenticated,
  isAdmin,
  upload.any(), 
  adminController.createContent 
);

// Route to POST the form data (for UPDATE)
router.post(
  '/edit-content/:id',
  isAuthenticated,
  isAdmin,
  upload.any(), 
  adminController.updateContent
);

module.exports = router;