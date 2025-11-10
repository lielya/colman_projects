// middleware/authMiddleware.js

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // User is authenticated, proceed
  }
  res.status(401).redirect('/login'); 
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  if (req.session.user.username === 'admin') {
    return next(); // User is admin, proceed
  }
  res.status(403).redirect('/main.html');
}

module.exports = {
  isAuthenticated,
  isAdmin
};