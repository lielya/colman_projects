const User = require('../models/User');
const mongoose = require('mongoose');

exports.register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not available. Please try again later.' });
    }

    // Check if user already exists
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      if (exists.email === email) {
        return res.status(409).json({ error: 'Email already exists' });
      } else {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    // Create new user (password will be hashed by pre-save hook in User model)
    const user = new User({ email, username, password });
    await user.save();

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username
    };
    
    res.status(201).json({ message: 'User registered successfully', user: userData });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user by username or email (support both)
    // If email is provided, search by email; if username is provided, search by username
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (username) {
      user = await User.findOne({ username: username.trim() });
    } else {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Username or password is wrong' });
    }

    // Compare password using bcrypt (from User model method)
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Username or password is wrong' });
    }

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username
    };

    req.session.user = userData;

    res.json({ message: 'success', user: userData });
  } catch (err) {
    console.error('Login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
